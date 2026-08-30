import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'About DifferenceAI | Smartphone Comparison',
  description:
    'DifferenceAI makes it easier to understand the differences between smartphones — search the catalog, compare devices side by side, explore detailed specs, and ask an AI assistant grounded in the real data.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const deviceCount = await prisma.device.count();
  const roundedCount = Math.floor(deviceCount / 100) * 100;

  return (
    <main className="device-shell content-shell">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
      <header>
        <span className="eyebrow">About</span>
        <h1>About DifferenceAI</h1>
        <p className="lede">
          DifferenceAI makes it easier to understand the differences between smartphones.
        </p>
      </header>

      <section className="comparison-section">
        <p>
          DifferenceAI was built to make smartphone research simpler. Instead of jumping between
          specification sheets and trying to remember how one phone compares with another,
          DifferenceAI puts phones side by side so you can quickly understand what actually
          separates them.
        </p>
        <p>
          Explore {roundedCount.toLocaleString()}+ smartphones, compare devices across generations
          and brands, and use the information to make a more informed buying decision. If you'd
          rather ask than read, an AI assistant on every comparison and phone page already knows
          which device (or devices) you're looking at, so you can just ask it a question instead
          of hunting through spec tables.
        </p>
        <p className="emphasis">Compare phones. Know the difference.</p>
      </section>

      <section>
        <div className="comparison-section-header">
          <span className="eyebrow">What DifferenceAI does</span>
          <h2>Search, compare, explore, ask, and buy</h2>
        </div>

        <div className="feature-grid">
          <div>
            <h3>Search</h3>
            <p>Find smartphones by model, brand, and other available filters.</p>
          </div>
          <div>
            <h3>Compare</h3>
            <p>Put multiple phones side by side and see how their specifications differ.</p>
          </div>
          <div>
            <h3>Explore</h3>
            <p>Dive into individual phone pages for detailed specifications and analysis.</p>
          </div>
          <div>
            <h3>Ask</h3>
            <p>
              Ask the built-in AI assistant a question about a phone, or the phones you&rsquo;re
              comparing &mdash; it already has the context, so there&rsquo;s nothing to re-select,
              and it answers from the real catalog data rather than guessing.
            </p>
          </div>
          <div>
            <h3>Buy</h3>
            <p>
              Where available, DifferenceAI provides links to supported retailers so you can
              continue your purchase.
            </p>
          </div>
        </div>
      </section>

      <section className="comparison-section">
        <div className="comparison-section-header">
          <span className="eyebrow">About the data</span>
          <h2>Where the specs come from</h2>
        </div>
        <p>
          DifferenceAI aggregates smartphone specifications from publicly available sources and
          organizes them into a searchable comparison database. This is the same data the AI
          assistant answers from &mdash; it&rsquo;s instructed not to invent specs that aren&rsquo;t
          in the catalog, and to say so plainly when something isn&rsquo;t there. While we work to
          keep the information accurate, specifications can occasionally contain errors or
          omissions. If you find an incorrect specification,{' '}
          <a href="/contact" className="ghost-link">
            please contact us
          </a>
          .
        </p>
      </section>

      <section className="comparison-section">
        <p>
          DifferenceAI is an independently developed product, built and maintained by a single
          developer.
        </p>
      </section>
    </main>
  );
}
