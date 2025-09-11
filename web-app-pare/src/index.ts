import { defineWebApplication, AppMenuItemExtension, AppWrapperRoute } from '@opencloud-eu/web-pkg'
import { urlJoin } from '@opencloud-eu/web-client'
import { RouteRecordRaw } from 'vue-router'
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import translations from '../l10n/translations.json'

import App from './App.vue'

export default defineWebApplication({
  setup(_args) {
    const { $gettext } = useGettext()

    const appInfo = {
      id: 'pare',
      name: $gettext('Pare Finance'),
      icon: 'money-euro-box',
      color: '#1eb980',
      defaultExtension: 'pson',
      extensions: [
        {
          extension: 'pson',
          routeName: 'pare-finance',

          // Make app present in the "New" file menu.
          newFileMenu: {
            menuTitle() {
              return $gettext('Pare Bill')
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
          title: $gettext('Pare Finance'),
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

    // Item for the menu when you click on 9 dots in the top left corner
    const menuItem = computed<AppMenuItemExtension[]>(() => [
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
      translations,
      extensions: menuItem
    }
  }
})
