// 图标系统配置
// 统一管理应用中使用的所有图标

import {
  Home,
  FileText,
  Edit3,
  Edit,
  Workflow,
  Settings,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderPlus,
  File,
  FilePlus,
  Users,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  X,
  Check,
  AlertCircle,
  Info,
  Zap,
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  Star,
  Heart,
  Bookmark,
  Share2,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  RotateCcw,
  Save,
  Menu,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Bell,
  Globe,
  Layers,
  Box,
  Archive,
  Circle,
  Book,
  User,
  LogOut,
  Key,
  Sparkles,
  Image,
  Video,
  Lock,
  Unlock
} from 'lucide-vue-next';

// 导航图标映射
export const navigationIcons = {
  home: Home,
  files: FileText,
  edit: Edit3,
  workflow: Workflow,
  settings: Settings
};

// 操作图标映射
export const actionIcons = {
  search: Search,
  add: Plus,
  play: Play,
  pause: Pause,
  stop: Square,
  save: Save,
  copy: Copy,
  delete: Trash2,
  refresh: RefreshCw,
  download: Download,
  upload: Upload,
  share: Share2,
  more: MoreHorizontal,
  menu: Menu,
  maximize: Maximize2,
  minimize: Minimize2,
  close: X,
  check: Check,
  undo: RotateCcw
};

// 状态图标映射
export const statusIcons = {
  success: Check,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
  loading: RefreshCw
};

// 文件类型图标映射
export const fileTypeIcons = {
  folder: Folder,
  folderOpen: FolderOpen,
  file: File,
  script: FileText,
  character: Users,
  asset: Star
};

// 界面图标映射
export const uiIcons = {
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  eye: Eye,
  eyeOff: EyeOff,
  grid: Grid3X3,
  list: List,
  filter: Filter,
  sortAsc: SortAsc,
  sortDesc: SortDesc,
  help: HelpCircle,
  external: ExternalLink
};

// 数据图标映射
export const dataIcons = {
  chart: BarChart3,
  trending: TrendingUp,
  clock: Clock,
  calendar: Calendar,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  zap: Zap
};

// 获取图标组件的辅助函数
export function getIcon(category, name) {
  const iconMaps = {
    navigation: navigationIcons,
    action: actionIcons,
    status: statusIcons,
    fileType: fileTypeIcons,
    ui: uiIcons,
    data: dataIcons
  };
  
  const iconMap = iconMaps[category];
  if (!iconMap) {
    console.warn(`Icon category "${category}" not found`);
    return null;
  }
  
  const icon = iconMap[name];
  if (!icon) {
    console.warn(`Icon "${name}" not found in category "${category}"`);
    return null;
  }
  
  return icon;
}

// 导出所有图标以便直接使用
export const icons = {
  ...navigationIcons,
  ...actionIcons,
  ...statusIcons,
  ...fileTypeIcons,
  ...uiIcons,
  ...dataIcons,
  // 额外的图标
  bell: Bell,
  globe: Globe,
  layers: Layers,
  box: Box,
  archive: Archive,
  circle: Circle,
  book: Book,
  grid: Grid3X3,
  refresh: RefreshCw,
  share: Share2,
  user: User,
  logOut: LogOut,
  key: Key,
  sparkles: Sparkles,
  users: Users,
  star: Star,
  trendingUp: TrendingUp,
  // 文件操作图标
  filePlus: FilePlus,
  folderPlus: FolderPlus,
  edit: Edit,
  trash: Trash2,
  image: Image,
  video: Video,
  x: X,
  plus: Plus,
  lock: Lock,
  unlock: Unlock
};

// 默认图标属性
export const defaultIconProps = {
  size: 20,
  strokeWidth: 1.5
};

// 图标尺寸预设
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};