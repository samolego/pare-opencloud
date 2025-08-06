export interface SidebarItem {
  id: number | string
  [key: string]: any
}

export interface SidebarConfig {
  title: string
  buttonText?: string
  buttonIcon?: string
  emptyMessage: string
  showCreateNewButton?: boolean
  titleField: string
  subtitleField?: string
  metaField?: string
  descriptionField?: string
}
