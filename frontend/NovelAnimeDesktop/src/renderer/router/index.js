import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Project from '../views/Project.vue';
import WorkflowEditor from '../views/WorkflowEditor.vue';

// Import all components directly to avoid dynamic import issues
import Files from '../views/Files.vue';
import Edit from '../views/Edit.vue';
import Settings from '../views/Settings.vue';
import DashboardView from '../views/DashboardView.vue';
import AssetsView from '../views/AssetsView.vue';
import CharactersView from '../views/CharactersView.vue';
import FilePreviewView from '../views/FilePreviewView.vue';

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
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView
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
    path: '/assets',
    name: 'assets',
    component: AssetsView
  },
  {
    path: '/characters',
    name: 'characters',
    component: CharactersView
  },
  {
    path: '/edit/:type/:id',
    name: 'file-edit',
    component: FilePreviewView,
    props: true
  },
  {
    path: '/preview/:type/:id',
    name: 'file-preview',
    component: FilePreviewView,
    props: true
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