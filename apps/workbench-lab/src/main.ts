import { mount } from 'svelte';

import App from './App.svelte';
import './styles.css';
import './themes/art-direction.css';

const target = document.getElementById('root');
if (!target) throw new Error('Workbench Lab root element is missing.');
mount(App, { target });
