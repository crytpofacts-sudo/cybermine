import { JsonRpcProvider, Contract } from "ethers";
const p = new JsonRpcProvider("https://bsc-testnet-rpc.publicnode.com", 97);
const abi = ["event Joined(address indexed user, address indexed referrer)"];
const c = new Contract("0xBa75A1CDAD9E5fF1218561f039b80D465A37723e", abi, p);

async function scan() {
  const block = await p.getBlockNumber();
  console.log("Current block:", block);
  for (let s = block - 500000; s < block; s += 10000) {
    const e = Math.min(s + 9999, block);
    try {
      const evts = await c.queryFilter("Joined", s, e);
      if (evts.length > 0) {
        console.log(evts.length, "events in", s, "-", e);
        evts.forEach(ev => console.log("  ", ev.blockNumber, ev.args[0]));
      }
    } catch { /* skip rate limited */ }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log("Done");
}
scan();
