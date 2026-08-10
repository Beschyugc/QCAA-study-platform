/**
 * Prints the address to open STUDYLINE from another device on the same
 * network — the laptop, a phone, whatever.
 *
 * Run:  npm run share
 *
 * This is the RIGHT way to use two machines. The database stays on this one,
 * the other machine just opens it in a browser, so there is exactly one copy
 * of your study data and nothing to sync, merge or lose. Copying the
 * database to a second machine (npm run backup) gives you two copies that
 * drift apart the moment you study on both.
 *
 * Nothing leaves your home network. There is no cloud, no port forwarding
 * and no account — the address below only works for devices on the same
 * Wi-Fi.
 */
import { hostname, networkInterfaces } from "node:os";

const PORT = process.env.PORT ?? "3000";

function lanAddresses(): { address: string; iface: string }[] {
  const out: { address: string; iface: string }[] = [];
  for (const [iface, addrs] of Object.entries(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      // 169.254.x.x is a self-assigned address that means "DHCP failed" —
      // it never routes anywhere useful, so offering it would just waste
      // someone's time typing it in.
      if (addr.address.startsWith("169.254.")) continue;
      out.push({ address: addr.address, iface });
    }
  }
  return out;
}

const addresses = lanAddresses();
const host = hostname();

console.log(`\nOpen STUDYLINE on another device on this Wi-Fi:\n`);
console.log(`  By name (survives the IP changing — try this first)`);
console.log(`    http://${host}:${PORT}\n`);

if (addresses.length > 0) {
  console.log(`  By address (use if the name doesn't resolve)`);
  for (const { address, iface } of addresses) {
    console.log(`    http://${address}:${PORT}      (${iface})`);
  }
} else {
  console.log(`  No network address found — is Wi-Fi connected?`);
}

console.log(`
  This machine has to be on, with 'npm run dev' running, for that to work.
  Sign in with the same passphrase you use here.

  Your router hands out addresses by DHCP, so the numeric one can change
  after a reboot. The name usually doesn't — prefer it.
`);
