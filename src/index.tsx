import React from 'react';
import ReactDOM from 'react-dom';
import { 
  connect, 
  IntentCtx, 
  RenderPageCtx, 
  ModelBlock, 
  RenderItemFormSidebarPanelCtx 
} from 'datocms-plugin-sdk';

import { render } from './utils/render';
import ConfigScreen from './entrypoints/ConfigScreen';
import UtilitiesPage from './entrypoints/UtilitiesPage'
import UtilitiesSidebar from './entrypoints/UtilitiesSidebar'

import 'datocms-react-ui/styles.css';

const isDev = document.location.hostname === 'localhost';

connect({
  renderConfigScreen(ctx) {
    return render(<ConfigScreen ctx={ctx} />);
  },
  mainNavigationTabs(ctx: IntentCtx) {
    const isAuthorized = ctx.currentRole.attributes.can_manage_menu
    if(!isAuthorized) return []
      
    return [
      {
        label: `Utilities${isDev ? ' (dev)' : ''}`,
        icon: 'wrench',
        placement: ['before', 'settings'],
        pointsTo: {
          pageId: 'utilities',
        },
      }
    ];
  },
  itemFormSidebarPanels(model: ModelBlock, ctx: IntentCtx) {
    if(model.attributes.api_key !== 'product') 
      return []
      
    return [
      {
        id: 'sidebarUtilities',
        label: 'Utilities',
        startOpen: true,
      },
    ];
  },
  renderItemFormSidebarPanel(sidebarPanelId, ctx: RenderItemFormSidebarPanelCtx) {
    ReactDOM.render(
      <React.StrictMode>
        <UtilitiesSidebar ctx={ctx}/>
      </React.StrictMode>,
      document.getElementById('root'),
    );
  },  
  renderPage(pageId, ctx: RenderPageCtx) {
    switch (pageId) {
      case 'utilities':
        return render(<UtilitiesPage ctx={ctx} />);
    }
  },
  async onBoot(ctx) {
    console.log(`orsjo-datocms-plugin v${require('../package.json').version}`);
  }
});