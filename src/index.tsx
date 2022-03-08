import React from 'react';
import ReactDOM from 'react-dom';

import { connect, IntentCtx, RenderPageCtx, ModelBlock, RenderItemFormSidebarPanelCtx } from 'datocms-plugin-sdk';
import { render } from './utils/render';
import ConfigScreen from './entrypoints/ConfigScreen';
import UtilitiesPage from './entrypoints/UtilitiesPage'
import UtilitiesSidebar from './entrypoints/UtilitiesSidebar'

import 'datocms-react-ui/styles.css';

const isDev = document.location.hostname === 'localhost';

function renderPage(component: React.ReactNode) {
  ReactDOM.render(
    <React.StrictMode>{component}</React.StrictMode>,
    document.getElementById('root'),
  );
}

connect({
  renderConfigScreen(ctx) {
    return render(<ConfigScreen ctx={ctx} />);
  },
  contentAreaSidebarItems(ctx: IntentCtx) {
    return [
      {
        label: `Utilities${isDev ? ' DEV' : ''}`,
        icon: 'wrench',
        placement: ['after', 'settings'],
        pointsTo: {
          pageId: 'utilities',
        },
      }
    ];
  },
  itemFormSidebarPanels(model: ModelBlock, ctx: IntentCtx) {
    if(model.attributes.api_key !== 'product') return []
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
  async onBoot(ctx) {
    console.log(`orsjo-datocms-plugin v${require('../package.json').version}`);
  },
  renderPage(pageId, ctx: RenderPageCtx) {
    switch (pageId) {
      case 'utilities':
        return render(<UtilitiesPage ctx={ctx} />);
    }
  },
});