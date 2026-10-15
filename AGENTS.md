<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Hub depot stock (hubs.tank_current_stock_gal) is maintained by DB triggers: deliveries add, fuel_logs inserts subtract (litres→gal); never adjust it from the client. Why: keeps the drawdown ledger tamper-proof.

- Fuel forms, displays and exports use US gallons; convert to the existing litre storage column only when saving and convert back when reading. Why: preserves existing fuel ledgers and depot triggers without changing user-facing units.
