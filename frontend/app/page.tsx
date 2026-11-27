"use client";

import { useState } from "react";

const services = [
  { icon: "A", name: "Buy Airtime", description: "Recharge any network", color: "rose", href: "#airtime" },
  { icon: "D", name: "Buy Data", description: "Affordable data bundles", color: "orange", href: "#data" },
  { icon: "T", name: "Pay Bills", description: "Electricity and more", color: "blue", href: "#bills" },
  { icon: "W", name: "Transactions", description: "View your activity", color: "green", href: "#transactions" },
];

export default function Home() {
  const [showFunding, setShowFunding] = useState(false);
  const [amount, setAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);

  return (
    <main className="min-h-screen bg-[#faf8f8] text-[#241d20]">
      <aside className="sidebar fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-[#eee7e8] bg-white px-6 py-7 lg:flex">
        <a href="#" className="mb-12 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#741b2b] text-lg font-black text-white">247</div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">247 Jtech Hub</p>
            <p className="text-xs text-[#92878a]">Your digital wallet</p>
          </div>
        </a>

        <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a69a9d]">Workspace</p>
        <nav className="space-y-2">
          <a className="nav-link active" href="#"><span>?</span> Overview</a>
          <a className="nav-link" href="#services"><span>?</span> Buy Services</a>
          <a className="nav-link" href="#transactions"><span>?</span> Transactions</a>
          <a className="nav-link" href="#wallet"><span>?</span> My Wallet</a>
        </nav>

        <p className="mb-4 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a69a9d]">Account</p>
        <nav className="space-y-2">
          <a className="nav-link" href="#profile"><span>?</span> Profile</a>
          <a className="nav-link" href="#support"><span>?</span> Help & Support</a>
        </nav>

        <div className="mt-auto rounded-2xl bg-[#faf4f5] p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-[#741b2b]">247</div>
          <p className="text-sm font-bold">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-[#82777a]">Our support team is here to help you.</p>
          <a href="#support" className="mt-3 inline-block text-xs font-bold text-[#741b2b]">Contact support ?</a>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-[#eee7e8] bg-white/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#741b2b] text-xs font-black text-white lg:hidden">247</div>
            <div>
              <p className="text-sm font-bold md:text-base">Overview</p>
              <p className="text-xs text-[#95898c]">Welcome to your dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#eee7e8] text-lg">?<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#741b2b]"></span></button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4e7e9] text-sm font-bold text-[#741b2b]">U</div>
              <div className="hidden sm:block"><p className="text-xs font-bold">My Account</p><p className="text-[11px] text-[#95898c]">Welcome</p></div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-9 md:py-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-[#9a858a]">Your dashboard</p>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Good to have you here.</h1>
              <p className="mt-2 text-sm text-[#897e81]">Manage your wallet and enjoy seamless payments.</p>
            </div>
            <button onClick={() => setShowFunding(true)} className="rounded-xl bg-[#741b2b] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#741b2b]/15 transition hover:bg-[#581320]">
              + Add money
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <section id="wallet" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#741b2b] via-[#681827] to-[#3e101b] p-6 text-white shadow-xl shadow-[#741b2b]/10 md:p-8">
              <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"></div>
              <div className="absolute -right-4 -top-12 h-48 w-48 rounded-full border border-white/10"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-white/70">Available wallet balance</p><div className="mt-3 flex items-center gap-3"><h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{showBalance ? "? — — —" : "••••••••"}</h2><button onClick={() => setShowBalance(!showBalance)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80">{showBalance ? "Hide" : "Show"}</button></div><p className="mt-2 text-xs text-white/55">Your live balance will appear here after connecting your account.</p></div>
                  <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl sm:flex">?</div>
                </div>
                <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
                  <div><p className="text-[10px] uppercase tracking-[.18em] text-white/55">Account currency</p><p className="mt-1 text-sm font-semibold">NGN · Nigerian Naira</p></div>
                  <button onClick={() => setShowFunding(true)} className="rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-[#741b2b] transition hover:bg-[#f9e9ec]">Fund wallet ?</button>
                </div>
              </div>
            </section>

            <section className="flex flex-col justify-between rounded-3xl border border-[#eee7e8] bg-white p-6 md:p-7">
              <div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8eef0] text-xl text-[#741b2b]">?</div><h3 className="mt-5 text-lg font-extrabold">Fast, simple payments.</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#8b8083]">Top up airtime, purchase data and manage your everyday payments from one place.</p></div>
              <button onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })} className="mt-6 flex w-fit items-center gap-2 text-sm font-bold text-[#741b2b]">Explore services <span>?</span></button>
            </section>
          </div>

          <section id="services" className="mt-10">
            <div className="mb-5 flex items-end justify-between"><div><h2 className="text-lg font-extrabold">Our services</h2><p className="mt-1 text-sm text-[#92878a]">What would you like to do today?</p></div><span className="text-xs font-semibold text-[#741b2b]">Explore all ?</span></div>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {services.map((service) => (
                <a key={service.name} href={service.href} className="service-card group rounded-2xl border border-[#eee7e8] bg-white p-5 transition hover:-translate-y-1 hover:border-[#d9b9bf] hover:shadow-lg hover:shadow-[#741b2b]/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8eef0] text-base font-extrabold text-[#741b2b]">{service.icon}</div>
                  <h3 className="mt-5 text-sm font-extrabold">{service.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#94898c]">{service.description}</p>
                  <p className="mt-4 text-xs font-bold text-[#741b2b]">Get started <span className="transition group-hover:ml-1">?</span></p>
                </a>
              ))}
            </div>
          </section>

          <section id="transactions" className="mt-10 overflow-hidden rounded-3xl border border-[#eee7e8] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0ebec] px-6 py-5">
              <div><h2 className="text-base font-extrabold">Recent transactions</h2><p className="mt-1 text-xs text-[#94898c]">Keep track of your wallet activity</p></div>
              <button className="rounded-lg border border-[#eee7e8] px-4 py-2 text-xs font-bold text-[#741b2b]">View all</button>
            </div>
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf4f5] text-2xl text-[#741b2b]">?</div>
              <h3 className="mt-4 text-sm font-bold">No transactions yet</h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-[#94898c]">Your wallet activity will appear here when you make a payment or fund your wallet.</p>
              <button onClick={() => setShowFunding(true)} className="mt-5 text-xs font-bold text-[#741b2b]">Fund your wallet ?</button>
            </div>
          </section>

          <footer className="py-8 text-center text-xs text-[#a3989b]">© 2026 247 Jtech Hub. Built for simple, secure payments.</footer>
        </div>
      </section>

      {showFunding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211419]/50 p-4" onClick={() => setShowFunding(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="fund-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl md:p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#9b858a]">Wallet</p><h2 id="fund-title" className="mt-2 text-xl font-extrabold">Add money</h2><p className="mt-1 text-sm text-[#8e8386]">Choose how much you want to add.</p></div><button onClick={() => setShowFunding(false)} aria-label="Close" className="rounded-full bg-[#f7f2f3] px-3 py-2 text-sm">?</button></div>
            <form className="mt-7" onSubmit={(event) => { event.preventDefault(); alert("Wallet funding will be connected to Paystack in the next step."); }}>
              <label htmlFor="amount" className="mb-2 block text-xs font-bold text-[#62575a]">Amount (NGN)</label>
              <div className="flex items-center rounded-xl border border-[#e9dfe1] px-4 focus-within:border-[#741b2b]"><span className="text-lg font-bold text-[#741b2b]">?</span><input id="amount" required min="100" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" className="w-full border-0 bg-transparent px-3 py-4 text-lg font-bold outline-none" /></div>
              <div className="mt-3 grid grid-cols-3 gap-2">{["1000", "2000", "5000"].map((value) => <button type="button" key={value} onClick={() => setAmount(value)} className="rounded-lg border border-[#eee7e8] py-2 text-xs font-bold hover:border-[#741b2b] hover:text-[#741b2b]">?{Number(value).toLocaleString("en-NG")}</button>)}</div>
              <button type="submit" className="mt-7 w-full rounded-xl bg-[#741b2b] py-4 text-sm font-bold text-white hover:bg-[#581320]">Continue to payment</button>
              <p className="mt-3 text-center text-[11px] text-[#9a8f92]">Secure payment processing will be enabled when Paystack is connected.</p>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
