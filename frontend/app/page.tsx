
const services = [
  {
    icon: "📱",
    title: "Airtime Top-up",
    description: "Recharge any supported mobile network in seconds.",
    label: "Buy Airtime",
    href: "#services",
  },
  {
    icon: "🌐",
    title: "Data Bundles",
    description: "Choose a data plan that fits your needs and budget.",
    label: "Buy Data",
    href: "#services",
  },
  
  {
    icon: "⚡",
    title: "Electricity Bills",
    description:
      "Pay supported prepaid and postpaid electricity bills and access your transaction details.",
    label: "Pay Electricity",
    href: "#services",
  },
  {
    icon: "🎓",
    title: "WAEC Services",
    description:
      "Access supported WAEC registration and result-checker products when available.",
    label: "Explore WAEC",
    href: "#services",
  },
  {
    icon: "📝",
    title: "JAMB Services",
    description:
      "We will verify available JAMB products with our provider before enabling purchases.",
    label: "Explore JAMB",
    href: "#services",
  },

  {
    icon: "💳",
    title: "Wallet Funding",
    description: "Keep funds ready for your next airtime or data purchase.",
    label: "Fund Wallet",
    href: "#wallet",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="border-b border-[#eee7e8] bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#741b2b] text-lg font-bold text-white">
              247
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                247 Jtech Hub
              </span>
              <span className="block text-xs text-[#716a6c]">
                VTU Platform
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-[#51494b] md:flex">
            <a href="#services" className="transition hover:text-[#741b2b]">
              Services
            </a>
            <a href="#how-it-works" className="transition hover:text-[#741b2b]">
              How it works
            </a>
            <a href="#wallet" className="transition hover:text-[#741b2b]">
              Wallet
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#get-started"
              className="hidden text-sm font-semibold sm:inline"
            >
              Log in
            </a>
            <a
              href="#get-started"
              className="rounded-xl bg-[#741b2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#581320]"
            >
              Get started
            </a>
          </div>
        </nav>
      </header>

      <section className="relative bg-[#f8f6f6]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ead9dd] bg-white px-4 py-2 text-sm font-medium text-[#741b2b]">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Your everyday VTU companion
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Stay connected.
              <span className="block text-[#741b2b]">
                Recharge with ease.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#716a6c] sm:text-lg">
              Buy airtime, data, electricity, and supported education products
from one simple platform built for everyday life.
            </p>

            <div
              id="get-started"
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <a
                href="#services"
                className="rounded-xl bg-[#741b2b] px-6 py-4 text-center font-semibold text-white transition hover:bg-[#581320]"
              >
                Explore services →
              </a>
              <a
                href="#how-it-works"
                className="rounded-xl border border-[#e5dadd] bg-white px-6 py-4 text-center font-semibold transition hover:border-[#741b2b]"
              >
                How it works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#716a6c]">
              <span>✓ Simple experience</span>
              <span>✓ Clear transaction records</span>
              <span>✓ Mobile-friendly design</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-[#eee7e8] bg-white p-6 shadow-xl shadow-[#741b2b]/5 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#716a6c]">Your next top-up</p>
                  <h2 className="mt-1 text-xl font-bold">Quick recharge</h2>
                </div>
                <span className="rounded-xl bg-[#f8f0f2] p-3 text-2xl">
                  ⚡
                </span>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="phone-preview"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone-preview"
                    type="tel"
                    placeholder="e.g. 08012345678"
                    className="w-full rounded-xl border border-[#e8e0e2] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#aaa1a4] focus:border-[#741b2b] focus:ring-2 focus:ring-[#741b2b]/10"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Choose a service</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="rounded-xl border border-[#741b2b] bg-[#fdf7f8] p-4 text-left"
                    >
                      <span className="block text-xl">📱</span>
                      <span className="mt-2 block text-sm font-semibold">
                        Airtime
                      </span>
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-[#eee7e8] p-4 text-left transition hover:border-[#741b2b]"
                    >
                      <span className="block text-xl">🌐</span>
                      <span className="mt-2 block text-sm font-semibold">
                        Data
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-[#741b2b] px-5 py-4 font-semibold text-white opacity-80"
                >
                  Quick recharge — coming soon
                </button>

                <p className="text-center text-xs leading-5 text-[#716a6c]">
                  Preview only. Purchases will be enabled after we implement
                  account security, payments, and transaction processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#741b2b]">
              Our services
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everyday essentials, made simple
            </h2>
            <p className="mt-4 leading-7 text-[#716a6c]">
              The essentials you need, with a straightforward experience from
              start to finish.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl border border-[#eee7e8] bg-white p-7 transition hover:-translate-y-1 hover:border-[#d9b9c0] hover:shadow-lg hover:shadow-[#741b2b]/5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f0f2] text-2xl">
                  {service.icon}
                </span>
                <h3 className="mt-6 text-xl font-bold">{service.title}</h3>
                <p className="mt-3 min-h-14 leading-7 text-[#716a6c]">
                  {service.description}
                </p>
                <a
                  href={service.href}
                  className="mt-5 inline-flex font-semibold text-[#741b2b] hover:text-[#581320]"
                >
                  {service.label} →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f8f6f6] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#741b2b]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Three simple steps
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Choose your service",
                description:
                  "Select airtime or data and provide the recipient details.",
              },
              {
                number: "02",
                title: "Pay securely",
                description:
                  "Use the available payment methods once checkout is implemented.",
              },
              {
                number: "03",
                title: "Track your transaction",
                description:
                  "Check the status and history of your purchases in one place.",
              },
            ].map((step) => (
              <article key={step.number} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#741b2b] font-bold text-white">
                  {step.number}
                </span>
                <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-sm leading-7 text-[#716a6c]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="wallet" className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-3xl bg-[#741b2b] p-8 text-white sm:p-12 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
              Your account, your records
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              A simpler way to manage your top-ups
            </h2>
            <p className="mt-4 leading-7 text-white/80">
              We&apos;re building account access, wallet funding, and transaction
              history to help you keep everything organized.
            </p>
          </div>
          <a
            href="#get-started"
            className="shrink-0 rounded-xl bg-white px-6 py-4 font-semibold text-[#741b2b] transition hover:bg-[#f8f0f2]"
          >
            Get started →
          </a>
        </div>
      </section>

      <footer className="border-t border-[#eee7e8] bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-[#716a6c] sm:flex-row sm:items-center">
          <p>
            <span className="font-bold text-[#242124]">247 Jtech Hub</span>
            {" "}· 247 VTU Platform
          </p>
          <p>
            A project in development. Live transactions are not yet available.
          </p>
        </div>
      </footer>
    </main>
  );
}
