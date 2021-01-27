import axios from 'axios';
import store from '../store/store';

export default {
  $http(header = {}) {
    return axios.create({
      baseURL: process.env.VUE_APP_ROOT_API,
      headers: {
        ...header,
        ...(store.getters.authToken()
          ? { Authorization: `Bearer ${store.getters.authToken()}` } : {}),
      },
    });
  },
};