# components/app/

**Owner:** Person 1. App-level pieces built from `components/ui`: the shell (demo banner, sidebar, phone tab bar),
the money calendar agenda, due list, fix options (`FixOptions` for Home, `FixChooser` for `/fix`), detected payees,
the approval inbox (`InboxList`), receipt display helpers (`receipt-words.ts`), the settings form (`SettingsForm`),
the demo guide's reset and copy buttons (`ResetDemo`, `CopyText`), the service-worker registration (`ServiceWorker`),
and the `/design` demos. Server actions live next to their pages in `app/(owner)/*/actions.ts` and are passed in as
props.
