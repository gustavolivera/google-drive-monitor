import { createRouter, createWebHistory } from "vue-router";
import AuthCallback from "../views/AuthCallback.vue";

const routes = [
  {
    path: "/auth/google/callback",
    name: "AuthCallback.vue",
    component: AuthCallback,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
