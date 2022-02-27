import { RenderConfigScreenCtx } from 'datocms-plugin-sdk';
import { Canvas, Form, FieldGroup, TextField, Button } from 'datocms-react-ui';
import s from './styles.module.css';

type Props = { ctx: RenderConfigScreenCtx; };

type FreshInstallationParameters = { host:'', username:'', password:''};

type ValidParameters = { host: string, username: string, password: string };

type Parameters = FreshInstallationParameters | ValidParameters;

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as Parameters;

  const saveSettings = () => {
    const { value : host } = document.getElementById('host') as HTMLInputElement;
    const { value : username } = document.getElementById('username') as HTMLInputElement;
    const { value : password } = document.getElementById('password') as HTMLInputElement;
    
    ctx.updatePluginParameters({ host, username, password })
   
  }

  return (
    <Canvas ctx={ctx}>
      <Form>
        <FieldGroup>
          <TextField
            required
            name="host"
            id="host"
            label="Server URL"
            value={parameters.host}
            placeholder="http://..."
            hint="Provide webserver host"
            onChange={(newValue) => ctx.updatePluginParameters({ host: newValue })}
          />
          <TextField
            required
            name="username"
            id="username"
            label="Username"
            value={parameters.username}
            placeholder="Basic auth username..."
            hint="Provide username"
            onChange={(newValue) => ctx.updatePluginParameters({ username: newValue })}
          />
          <TextField
            required
            name="password"
            id="password"
            label="Password"
            value={parameters.password}
            placeholder="Basic auth password..."
            hint="Provide password"
            onChange={(newValue) => ctx.updatePluginParameters({ password: newValue })}
          />
          <Button onClick={saveSettings}>Save settings</Button>
        </FieldGroup>
      </Form>
    </Canvas>
  );
}
