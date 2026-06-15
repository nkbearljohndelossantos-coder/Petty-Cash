import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, ArrowUp, List } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Lightweight markdown → JSX parser                                 */
/* ------------------------------------------------------------------ */

function parseMarkdown(md) {
  const lines = md.split('\n');
  const blocks = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (!buf.length) return;
    const text = buf.join(' ').trim();
    if (text) blocks.push({ type: 'p', text });
  };

  while (i < lines.length) {
    const line = lines[i];

    /* horizontal rule */
    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    /* heading */
    const hMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      blocks.push({ type: `h${level}`, text, id });
      i++;
      continue;
    }

    /* table */
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|---')) {
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i]
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        if (cells.length && !cells.every((c) => /^-+:?$/.test(c))) {
          rows.push(cells);
        }
        i++;
      }
      if (rows.length > 1) {
        const [head, ...body] = rows;
        blocks.push({ type: 'table', head, body });
      }
      continue;
    }

    /* blockquote */
    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }

    /* list item */
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    /* empty line → flush paragraph buffer */
    if (line.trim() === '') {
      i++;
      continue;
    }

    /* paragraph (collect consecutive non-special lines) */
    const paraBuf = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3}|\s*[-*]\s+|\s*---+\s*$|>)/.test(lines[i]) && !lines[i].includes('|')) {
      paraBuf.push(lines[i]);
      i++;
    }
    flushParagraph(paraBuf);
  }

  return blocks;
}

/* inline formatting: **bold** */
function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <span key={idx}>{part}</span>;
  });
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

const SectionHeading = ({ level, id, children }) => {
  const base = 'font-semibold text-slate-100 scroll-mt-24';
  const cls =
    level === 1
      ? `${base} text-3xl mb-6 pb-3 border-b border-slate-700/60`
      : level === 2
      ? `${base} text-xl mt-10 mb-4 flex items-center gap-2`
      : `${base} text-lg mt-6 mb-3 text-slate-200`;
  const Tag = `h${level}`;
  return <Tag id={id} className={cls}>{children}</Tag>;
};

const MdTable = ({ head, body }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-700/50 my-5">
    <table className="w-full text-sm">
      <thead className="bg-slate-800/80">
        <tr>
          {head.map((h, i) => (
            <th key={i} className="px-4 py-3 text-left font-semibold text-slate-300 border-b border-slate-700">
              {renderInline(h)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-700/50">
        {body.map((row, ri) => (
          <tr key={ri} className="hover:bg-slate-800/40 transition-colors">
            {row.map((cell, ci) => (
              <td key={ci} className="px-4 py-3 text-slate-300">
                {renderInline(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MdList = ({ items }) => (
  <ul className="list-disc list-inside space-y-1.5 my-4 text-slate-300 marker:text-emerald-500">
    {items.map((it, i) => (
      <li key={i}>{renderInline(it)}</li>
    ))}
  </ul>
);

const MdBlockquote = ({ text }) => (
  <blockquote className="border-l-4 border-emerald-500/60 bg-emerald-500/5 rounded-r-lg pl-4 pr-4 py-3 my-5 text-slate-300 italic">
    {renderInline(text)}
  </blockquote>
);

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function UserManual() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    fetch('/USER_MANUAL.md')
      .then((r) => r.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent('# Error\n\nCould not load user manual.');
        setLoading(false);
      });
  }, []);

  const blocks = useMemo(() => parseMarkdown(content), [content]);
  const headings = useMemo(
    () => blocks.filter((b) => b.type === 'h2').map((b) => ({ id: b.id, text: b.text })),
    [blocks]
  );

  /* scroll spy */
  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  };

  const scrollTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <BookOpen className="animate-pulse" size={24} />
          <span>Loading manual…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      {/* Mobile TOC toggle */}
      <button
        onClick={() => setTocOpen(!tocOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-slate-800 border border-slate-700 shadow-lg text-slate-300"
      >
        <List size={20} />
      </button>

      {/* Sidebar TOC */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen z-40 w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 transform transition-transform duration-300 ${
          tocOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col p-5 overflow-y-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">User Manual</h2>
              <p className="text-[11px] text-slate-500">NKB Petty Cash System</p>
            </div>
          </div>

          <nav className="space-y-0.5 flex-1">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => scrollTo(h.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  activeId === h.id
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <ChevronRight
                  size={14}
                  className={`transition-transform ${activeId === h.id ? 'rotate-90' : ''}`}
                />
                <span className="truncate">{h.text}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={scrollTop}
            className="mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors border border-slate-700"
          >
            <ArrowUp size={14} />
            Back to Top
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {tocOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setTocOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        ref={mainRef}
        className="flex-1 max-w-4xl mx-auto px-6 py-10 lg:px-12 overflow-y-auto h-screen scroll-smooth"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {blocks.map((block, idx) => {
            switch (block.type) {
              case 'h1':
                return (
                  <SectionHeading key={idx} level={1} id={block.id}>
                    {renderInline(block.text)}
                  </SectionHeading>
                );
              case 'h2':
                return (
                  <SectionHeading key={idx} level={2} id={block.id}>
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {headings.findIndex((h) => h.id === block.id) + 1}
                    </span>
                    {renderInline(block.text)}
                  </SectionHeading>
                );
              case 'h3':
                return (
                  <SectionHeading key={idx} level={3} id={block.id}>
                    {renderInline(block.text)}
                  </SectionHeading>
                );
              case 'p':
                return (
                  <p key={idx} className="leading-relaxed text-slate-300 my-4">
                    {renderInline(block.text)}
                  </p>
                );
              case 'ul':
                return <MdList key={idx} items={block.items} />;
              case 'table':
                return <MdTable key={idx} head={block.head} body={block.body} />;
              case 'blockquote':
                return <MdBlockquote key={idx} text={block.text} />;
              case 'hr':
                return <hr key={idx} className="my-8 border-slate-800" />;
              default:
                return null;
            }
          })}

          <div className="mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            <p>NKB Petty Cash Management System — User Manual v1.0</p>
            <p className="mt-1">© NKB Manufacturing. All rights reserved.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
