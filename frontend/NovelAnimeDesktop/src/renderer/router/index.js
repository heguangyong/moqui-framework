import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Project from '../views/Project.vue';
import WorkflowEditor from '../views/WorkflowEditor.vue';

// Import all components directly to avoid dynamic import issues
import Files from '../views/Files.vue';
import Edit from '../views/Edit.vue';
import Settings from '../views/Settings.vue';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: Home
  },
  {
    path: '/files',
    name: 'files',
    component: Files
  },
  {
    path: '/edit',
    name: 'edit',
    component: Edit
  },
  {
    path: '/workflow',
    name: 'workflow',
    component: WorkflowEditor
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings
  },
  {
    path: '/project/:id',
    name: 'project',
    component: Project,
    props: true
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;