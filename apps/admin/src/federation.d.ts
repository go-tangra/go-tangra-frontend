// Module Federation remote type declarations

declare module 'bookmark/module' {
  import type { TangraModule } from '@tangra/module-sdk';

  const module: TangraModule;
  export default module;
}
