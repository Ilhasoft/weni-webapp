<template>
  <div v-if="isOpen" class="right-sidebar__side-menu">
    <div class="right-sidebar__side-menu__content">
      <div class="right-sidebar__side-menu__content__info">
        <unnnic-icon clickable icon="keyboard-arrow-left-1" @click="close" />
        <div class="right-sidebar__side-menu__content__info__text">
          <h1>{{ action.title }}</h1>
          <h2>{{ action.description }}</h2>
        </div>
      </div>

      <div class="right-sidebar__side-menu__separator" />

      <component
        class="right-sidebar__side-menu__component"
        :is="action.component"
        v-bind="action.props"
        @finish="action.onFinished($event)"
      />
    </div>
  </div>
</template>

<script>
import orgPermissionsRead from "./orgs/orgPermissionsRead.vue";
import orgPermissions from "./orgs/orgPermissions.vue";

export default {
  components: {
    orgPermissionsRead,
    orgPermissions,
  },

  props: {},

  data() {
    return {
      type: '',
      isOpen: false,
      props: {},
    };
  },

  computed: {
    action() {
      if (this.type === "view members") {
        return {
          title: this.$t("orgs.view_members"),
          description: this.$t("orgs.view_members_description"),
          component: 'org-permissions-read',
          props: {
            org: this.props.organization,
          },
          onFinished: () => {
            this.orgAction = null;
          },
        };
      } else if (this.type === 'manage members') {
        return {
          title: this.$t("orgs.manage_members"),
          description: this.$t("orgs.manage_members_description"),
          component: 'org-permissions',
          props: {
            org: this.props.organization,
          },
          onFinished: () => {
            this.orgAction = null;
          },
        };
      }
    },
  },

  methods: {
    open(type, props) {
      this.type = type;
      this.props = props;
      this.isOpen = true;
    },

    close() {
      this.isOpen = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@weni/unnnic-system/src/assets/scss/unnnic.scss";

.right-sidebar__side-menu {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 500;
  display: flex;
  justify-content: flex-end;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;

  &__separator {
    border: 1px solid $unnnic-color-neutral-soft;
    margin: $unnnic-spacing-stack-md 0 1rem 0;
  }

  &__component {
    flex: 1;
  }

  &__content {
    max-width: 500px;
    padding: 32px;
    background-color: white;
    display: flex;
    flex-direction: column;

    h1 {
      margin: 0;
      font-size: $unnnic-font-size-title-sm;
      font-weight: $unnnic-font-weight-bold;
      line-height: $unnnic-font-size-title-sm + $unnnic-line-height-medium;
    }

    h2 {
      margin: 0;
      font-weight: $unnnic-font-weight-regular;
      font-size: $unnnic-font-size-body-gt;
      line-height: $unnnic-font-size-title-sm + $unnnic-line-height-medium;
      color: $unnnic-color-neutral-cloudy;
    }

    &__info {
      display: flex;
      &__text {
        flex: 1;
        margin-left: 1rem;
      }
    }
  }
}
</style>