<template>
  <div>
    <div class="group">
      <org-permission-select
        v-model="role"
        :label="labelRole"
        class="weni-org-permissions__permission-select"
      />

      <unnnic-input
        class="flex-1"
        v-model="userSearch"
        :type="userError ? 'error' : 'normal'"
        :message="userError"
        :label="labelEmail"
        :placeholder="$t('orgs.create.user_search_description')"
        icon-right="keyboard-return-1"
        :tooltip-icon-right="$t('orgs.create.press_enter_to_add')"
        :tooltip-side-icon-right="tooltipSideIconRight"
        :tooltip-force-open-icon-right="forceTooltipPressEnterOpen"
        @keyup.enter="onSubmit"
        @input="userError = null"
        :disabled="loadingAddingUser"
      />
    </div>

    <div class="users">
      <div :style="{ height: 0 }">
        <org-role
          v-for="(user, index) in users"
          :disabled="isMe(user)"
          :role="user.role"
          :key="index"
          :email="user.email"
          :username="user.username"
          :name="isMe(user) ? $t('orgs.you') : user.name"
          :image-url="user.photo"
          :delete-tooltip="isMe(user) ? $t('orgs.users.leave') : $t('orgs.users.remove')"
          :can-delete="cannotDeleteMyUser ? !isMe(user) : true"
          @onChangeRole="onEdit($event, user)"
          @onDelete="onRemove(user)"
          class="user"
        />
        <infinite-loading v-if="!doNotFetch" @infinite="$emit('fetch-permissions', $event)" />
      </div>
    </div>

    <confirm-modal
      :open="removingUser != null"
      type="danger"
      :title="removeTitle"
      :description="removeText"
      :confirmText="removeTitle"
      :cancelText="$t('cancel')"
      @close="removingUser = null"
      @confirm="removeRole"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import OrgPermissionSelect from './orgPermissionSelect';
import OrgRole from './orgRole.vue';
import InfiniteLoading from '../InfiniteLoading';
import ConfirmModal from '../ConfirmModal';
import { unnnicCallModal } from '@weni/unnnic-system';

export default {
  components: {
    OrgPermissionSelect,
    OrgRole,
    InfiniteLoading,
    ConfirmModal,
  },

  props: {
    labelRole: {
      type: String,
    },

    labelEmail: {
      type: String,
    },

    tooltipSideIconRight: {
      type: String,
    },

    users: {
      type: Array,
    },

    changes: {
      type: Object,
    },

    doNotFetch: {
      type: Boolean,
    },

    cannotDeleteMyUser: {
      type: Boolean,
    },

    org: {
      type: Object,
    },
  },

  data() {
    return {
      role: '3',

      userSearch: '',
      userError: null,
      forceTooltipPressEnterOpen: true,

      loadingAddingUser: false,

      removingUser: null,
    };
  },

  computed: {
    userLogged() {
      return JSON.parse(localStorage.getItem('user'));
    },

    removeTitle() {
      if (!this.removingUser) return '';

      const user = this.users.find(user => user.username === this.removingUser);

      if (this.isMe(user)) return this.$t('orgs.leave');
      return this.$t('orgs.remove_member');
    },

    removeText() {
      if(!this.removingUser) return '';

      const user = this.users.find(user => user.username === this.removingUser);

      if (this.isMe(user)) return this.$t('orgs.leave_description');
      return this.$t('orgs.remove_member_description', 
          { user: user.name, 
            org: this.org.name })
    },
  },

  methods: {
    ...mapActions([
      'searchUsers',
      'leaveOrg',
      'removeAuthorization',
    ]),

    isMe(user) {
      return user.username === this.userLogged.username;
    },

    onEdit(role, user) {
      this.$emit('changes', {
        ...this.changes,
        [user.id]: {
          ...user,
          role,
        },
      });
    },

    clearUserFromChanges(user) {
      this.$emit('users', this.users.filter(item => item.username !== user.username));
      delete this.changes[user.id];
      this.$emit('changes', this.changes);
    },

    onRemove(user) {
      if (user.offline) {
        this.clearUserFromChanges(user);
      } else {
        this.removingUser = user.username;
      }
    },

    async removeRole() {
      const user = this.users.find(user => user.username === this.removingUser);

      if (this.isMe(user)) {
        this.onLeaveOrg(user.username);
        return;
      }
      try {
        await this.removeAuthorization({
          orgId: this.org.uuid,
          username: user.id,
        });
        this.$emit('finish');
        this.clearUserFromChanges(user);
        unnnicCallModal({
          props: {
            text: this.$t('orgs.removed_member'),
            description: this.$t('orgs.removed_member_success', { user: this.removingUser }),
            scheme: "feedback-green",
            icon: "check-circle-1",
          },
        });
      } catch(e) {
        unnnicCallModal({
          props: {
            text: this.$t('orgs.error'),
            description: this.$t('orgs.save_error'),
            scheme: "feedback-red",
            icon: "check-circle-1",
        },
      });
      } finally {
        this.removingUser = null;
      }
    },

    async onLeaveOrg(username) {
      try {
        await this.leaveOrg({
          orgId: this.org.uuid,
          username,
        });
        unnnicCallModal({
          props: {
            text: this.$t('orgs.saved_changes'),
            description: this.$t('orgs.saved_changes_success'),
            scheme: "feedback-green",
            icon: "check-circle-1",
          },
        });
        this.$emit('finish');
      } catch(e) {
        unnnicCallModal({
          props: {
            text: this.$t('orgs.error'),
            description: this.$t('orgs.save_error'),
            scheme: "feedback-red",
            icon: "check-circle-1",
        },
      });
      } finally {
        this.removingUser = null;
      }
    },

    async onSubmit() {
      this.loadingAddingUser = true;

      try {
        const email = this.userSearch.toLowerCase();

        const response = await this.searchUsers({
          search: email,
        });

        const { data } = response;

        const users = data.filter(user => user.email === email);

        if (!users.length) {
          this.userError = this.$t('orgs.invalid_email');
          return false;
        }

        this.forceTooltipPressEnterOpen = false;

        const [ user ] = users;

        const addedUser = {
          id: user.id,
          uuid: Math.random(),
          name: [user.first_name, user.last_name].filter(name => name).join(' '),
          email: user.email,
          photo: user.photo,
          role: this.role,
          username: user.username,
          offline: true,
        }

        this.$emit('changes', {
          ...this.changes,
          [addedUser.id]: addedUser,
        });

        this.$emit('users', this.users.concat(addedUser));

        this.userSearch = '';
        this.role = '3';
      } catch (e) {
        this.users = [];
      } finally {
        this.loadingAddingUser = false;
      }
    },
  }
};
</script>

<style lang="scss" scoped>
@import '~@weni/unnnic-system/src/assets/scss/unnnic.scss';

.group {
  display: flex;
  margin-bottom: $unnnic-spacing-stack-md;

  > *:not(:last-child) {
    margin-right: $unnnic-spacing-stack-sm;
  }

  .flex-1 {
    flex: 1;
  }
}

.users {
  flex: 1;
  overflow: overlay;
  min-height: 4rem;

  $scroll-size: $unnnic-inline-nano;
  padding-right: calc(#{$unnnic-inline-xs} + #{$scroll-size});
  width: 100%;

  &::-webkit-scrollbar {
    width: $scroll-size;
  }

  &::-webkit-scrollbar-thumb {
    background: $unnnic-color-neutral-clean;
    border-radius: $unnnic-border-radius-pill;
  }
  
  &::-webkit-scrollbar-track {
    background: $unnnic-color-neutral-soft;
    border-radius: $unnnic-border-radius-pill;
  }

  .user {
    margin-bottom: $unnnic-spacing-stack-sm;
  }
}
</style>