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
import MyProjectsView from '../views/MyProjectsView.vue';
import SharedProjectsView from '../views/SharedProjectsView.vue';
import TasksView from '../views/TasksView.vue';
import RecentlyEditedView from '../views/RecentlyEditedView.vue';
import ArchiveView from '../views/ArchiveView.vue';
import WorkflowStatusView from '../views/WorkflowStatusView.vue';
import WorkflowTemplatesView from '../views/WorkflowTemplatesView.vue';
import WorkflowExecutionsView from '../views/WorkflowExecutionsView.vue';
import WorkflowDetailView from '../views/WorkflowDetailView.vue';
import AssetCategoryView from '../views/AssetCategoryView.vue';
import CharacterDetailView from '../views/CharacterDetailView.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
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
    path: '/workflow/new',
    name: 'workflow-new',
    component: WorkflowEditor
  },
  {
    path: '/workflow/status/:status',
    name: 'workflow-status',
    component: WorkflowStatusView,
    props: true
  },
  {
    path: '/workflow/templates',
    name: 'workflow-templates',
    component: WorkflowTemplatesView
  },
  {
    path: '/workflow/templates/:id',
    name: 'workflow-template-detail',
    component: WorkflowTemplatesView,
    props: true
  },
  {
    path: '/workflow/executions',
    name: 'workflow-executions',
    component: WorkflowExecutionsView
  },
  {
    path: '/workflow/executions/:id',
    name: 'workflow-execution-detail',
    component: WorkflowExecutionsView,
    props: true
  },
  {
    path: '/workflow/detail/:id',
    name: 'workflow-detail',
    component: WorkflowDetailView,
    props: true
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
    path: '/assets/:category',
    name: 'asset-category',
    component: AssetCategoryView,
    props: true
  },
  {
    path: '/assets/detail/:id',
    name: 'asset-detail',
    component: AssetCategoryView,
    props: true
  },
  {
    path: '/characters',
    name: 'characters',
    component: CharactersView
  },
  {
    path: '/characters/new',
    name: 'character-new',
    component: CharacterDetailView
  },
  {
    path: '/characters/:id',
    name: 'character-detail',
    component: CharacterDetailView,
    props: true
  },
  {
    path: '/projects/my',
    name: 'my-projects',
    component: MyProjectsView
  },
  {
    path: '/projects/shared',
    name: 'shared-projects',
    component: SharedProjectsView
  },
  {
    path: '/tasks/:status',
    name: 'tasks',
    component: TasksView,
    props: true
  },
  {
    path: '/history/recent',
    name: 'recently-edited',
    component: RecentlyEditedView
  },
  {
    path: '/history/archive',
    name: 'archive',
    component: ArchiveView
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