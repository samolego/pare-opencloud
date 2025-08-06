import {
  defineWebApplication,
  ApplicationSetupOptions,
  Extension,
  AppMenuItemExtension,
  AppWrapperRoute
} from '@opencloud-eu/web-pkg'
import { urlJoin } from '@opencloud-eu/web-client'
import { RouteRecordRaw } from 'vue-router'
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'

import App from './App.vue'

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()

    const appInfo = {
      id: 'pare',
      name: $gettext('Pare Finance'),
      icon: 'money-euro-box',
      color: '#1eb980',
      defaultExtension: 'pcsv',
      extensions: [
        {
          extension: 'pcsv',
          routeName: 'pare-finance',

          // Add this if you want your app to be present in the "New" file menu.
          newFileMenu: {
            menuTitle() {
              return $gettext('Pare CSV Bills')
            }
          }
        }
      ]
    }

    const routes: RouteRecordRaw[] = [
      {
        name: 'pare-finance',
        path: '/:driveAliasAndItem(.*)?',
        component: AppWrapperRoute(App, {
          applicationId: appInfo.id
        }),
        meta: {
          authContext: 'hybrid',
          title: $gettext('Advanced PDF Viewer'),
          patchCleanPath: true
        }
      },
      {
        path: '/about',
        name: 'about',
        component: () => import('./ui/About.vue'),
        meta: {
          authContext: 'hybrid',
          title: $gettext('About')
        }
      }
    ]

    const menuItems = computed<AppMenuItemExtension[]>(() => [
      {
        // registers a menu item for the app switcher
        id: `app.${appInfo.id}.menuItem`,
        type: 'appMenuItem',
        label: () => appInfo.name,
        color: appInfo.color,
        icon: appInfo.icon,
        path: urlJoin(appInfo.id, 'about')
      }
    ])

    return {
      appInfo,
      routes,
      extensions: menuItems
    }
  }
})
