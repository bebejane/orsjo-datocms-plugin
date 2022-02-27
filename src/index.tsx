import React from 'react';
import ReactDOM from 'react-dom';

import { connect, IntentCtx, RenderPageCtx } from 'datocms-plugin-sdk';
import { render } from './utils/render';
import ConfigScreen from './entrypoints/ConfigScreen';
import UtilitiesPage from './entrypoints/UtilitiesPage'

import 'datocms-react-ui/styles.css';

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
        label: 'Utilities',
        icon: 'wrench',
        placement: ['after', 'settings'],
        pointsTo: {
          pageId: 'utilities',
        },
      },
    ];
  },
  renderPage(pageId, ctx: RenderPageCtx) {
    switch (pageId) {
      case 'utilities':
        return render(<UtilitiesPage ctx={ctx} />);
    }
  },
});

console.log(`orsjo-datocms-plugin v${require('../package.json').version}`);