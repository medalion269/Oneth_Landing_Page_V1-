"use client";

/**
 * A decision, as the app's Decision detail page lays it out (frontend/src/app/decisions/DecisionDetailPage.tsx;
 * DESIGN.md: document 4, decision record 5, actions 3). Three of Saffron Grove's decisions can be worked through here:
 * the Desert Line invoice (approve), the Bazaar Lane card payment with no receipt (ask the client, then approve), and
 * the Al Manara payment that matches two bills (pick one). Record wording follows the Review scene
 * (components/ApprovalWorkflow.tsx), copied rather than imported because that scene's parts start hidden for GSAP.
 */

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import { AppCard, Chip, ConfidenceBar, ICON_SM, PillButton, type Tone } from "../app/ui";
import {
  aed,
  alManaraBills,
  alManaraLine,
  bazaarEntry,
  bazaarInvoice,
  bazaarLine,
  client,
  explanation,
  formatTrn,
  invoice,
  portalQuestion,
  precedentBills,
  preparedEntry,
} from "@/lib/demo-data";
import { STORY_ORDER, SG_NOVEMBER, nextOpen, type StoryId, type World } from "@/lib/hero-story";
import type { StoryActions } from "./useStory";
import { ClientPhone, InvoicePhoto } from "./ClientPhone";
import { InvoicePdf } from "./InvoicePdf";

const RULE = "Input VAT on a valid tax invoice · v3";
const POLICY = "Office consumables go to 6120";
const NOT_WRITTEN = "oneth only proposes. Nothing is written to your books.";

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12px] font-semibold leading-[16px] text-muted">{label}</p>
      {children}
    </div>
  );
}

function Fields({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[13px] leading-[18px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="truncate text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Journal({ lines }: { lines: { code: string; account: string; debit: number; credit: number }[] }) {
  return (
    <table className="w-full table-fixed text-[12.5px] tabular-nums">
      <colgroup>
        <col />
        <col className="w-[84px]" />
        <col className="w-[84px]" />
      </colgroup>
      <thead>
        <tr className="border-b border-line-soft text-left text-[12px] text-muted">
          <th className="py-1 font-normal">Account</th>
          <th className="py-1 text-right font-normal">Debit</th>
          <th className="py-1 text-right font-normal">Credit</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.code} className="border-b border-line-soft last:border-0">
            <td className="truncate py-1.5 pr-2">
              <span className="font-semibold">{l.code}</span> <span className="text-muted">{l.account}</span>
            </td>
            <td className="py-1.5 text-right">{l.debit ? aed(l.debit) : ""}</td>
            <td className="py-1.5 text-right">{l.credit ? aed(l.credit) : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const STATUS: Record<"review" | "escalated" | "approved" | "overturned", { label: string; tone: Tone }> = {
  review: { label: "Needs review", tone: "review" },
  escalated: { label: "Escalated", tone: "blocked" },
  approved: { label: "Approved", tone: "done" },
  overturned: { label: "Overturned", tone: "neutral" },
};

function status(id: StoryId, w: World) {
  if (id === "desert") return STATUS[w.desert === "approved" ? "approved" : "review"];
  if (id === "bazaar") return STATUS[w.bazaar === "approved" ? "approved" : "escalated"];
  return STATUS[w.manara === null ? "escalated" : w.manara === "AMC-3391" ? "approved" : "overturned"];
}

const decided = (id: StoryId, w: World) => (id === "desert" ? w.desert === "approved" : id === "bazaar" ? w.bazaar === "approved" : w.manara !== null);

/* ------------------------------------------------------------------ */
/* The three columns                                                   */
/* ------------------------------------------------------------------ */

function DocumentColumn({ id, w, actions }: { id: StoryId; w: World; actions: StoryActions }) {
  if (id === "desert") {
    return (
      <AppCard title="Document" action={<span className="text-[12px] text-muted">Received {invoice.date}</span>} className="h-full min-h-0 overflow-hidden">
        <InvoicePdf />
      </AppCard>
    );
  }
  if (id === "bazaar") {
    const answered = w.bazaar === "answered" || w.bazaar === "approved";
    return (
      <div className="relative h-full min-h-0">
        <AppCard title="Bank line" className="h-full min-h-0 overflow-hidden">
          <Fields
            rows={[
              ["Date", bazaarLine.date],
              ["Description", bazaarLine.description],
              ["Amount", `AED ${aed(bazaarLine.amount)}`],
              ["Account", `ending ${bazaarLine.account}`],
            ]}
          />
          {answered ? (
            <Section label="Attached by the client">
              <InvoicePhoto />
            </Section>
          ) : (
            <p className="rounded-app-tile bg-line-soft px-4 py-3 text-[13px] leading-[18px] text-muted">No document. This decision comes from a bank line.</p>
          )}
        </AppCard>
        {w.bazaar === "asked" && w.phone !== "hidden" && <ClientPhone stage={w.phone} />}
      </div>
    );
  }
  // Al Manara: the two open bills the payment could settle
  return (
    <AppCard title="Open bills · Al Manara Catering" className="h-full min-h-0 overflow-hidden">
      <p className="text-[13px] leading-[18px] text-muted">
        Bank line {alManaraLine.date} · {alManaraLine.description} · AED {aed(alManaraLine.amount)}
      </p>
      <div data-guide="bills" className="flex flex-col gap-2">
        {alManaraBills.map((b) => {
          const chosen = w.manara === b.ref;
          const other = w.manara !== null && !chosen;
          return (
            <button
              key={b.ref}
              type="button"
              disabled={w.manara !== null}
              onClick={() => actions.match(b.ref)}
              className={`flex w-full flex-col gap-1 rounded-app-tile px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                chosen ? "bg-accent-soft" : "bg-line-soft"
              } ${w.manara === null ? "cursor-pointer hover:bg-line" : ""} ${other ? "opacity-60" : ""}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold leading-[20px]">{b.ref}</span>
                <span className="text-[14px] font-semibold tabular-nums">AED {aed(alManaraLine.amount)}</span>
              </span>
              <span className="text-[13px] leading-[18px] text-muted">{b.description}</span>
              <span className="flex flex-wrap items-center justify-between gap-2 text-[12px] leading-[16px] text-muted">
                <span>
                  Issued {b.issued} · <span className="font-semibold text-ink">Due {b.due}</span>
                </span>
                {chosen ? (
                  <Chip size="sm" tone="done">
                    <Check {...ICON_SM} /> Matched
                  </Chip>
                ) : other ? (
                  <Chip size="sm">Stays open</Chip>
                ) : b.suggested ? (
                  <Chip size="sm" tone="accent">
                    oneth suggests · {Math.round(b.suggested * 100)}%
                  </Chip>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </AppCard>
  );
}

function RecordCard({ id, w }: { id: StoryId; w: World }) {
  const st = status(id, w);
  const kind = id === "desert" ? "Classification" : id === "bazaar" ? "Missing evidence" : "Bank match";
  const answered = w.bazaar === "answered" || w.bazaar === "approved";
  return (
    <AppCard
      title="Decision record"
      action={
        <span className="flex items-center gap-1.5">
          <Chip size="sm">{kind}</Chip>
          <Chip size="sm" tone={st.tone}>
            {st.label}
          </Chip>
        </span>
      }
      className="record-fade h-full min-h-0 overflow-hidden"
    >
      <div className="flex min-h-0 flex-col gap-3">
        {id === "desert" && (
          <>
            <Section label="Issue">
              <p className="text-[14px] font-semibold leading-[20px]">
                Classify {invoice.supplierShort} invoice {invoice.number}
              </p>
            </Section>
            <Section label="Evidence">
              <Fields
                rows={[
                  ["Supplier TRN", formatTrn(invoice.supplierTrn)],
                  ["Invoice", `${invoice.number} · ${invoice.date}`],
                  ["Net · VAT · total", `AED ${aed(invoice.net)} · ${aed(invoice.vat)} · ${aed(invoice.total)}`],
                ]}
              />
            </Section>
            <Section label="Rule, policy and precedents">
              <Fields rows={[["Rule", RULE], ["Policy", POLICY], ["Precedents", `${precedentBills} applied`]]} />
            </Section>
            <Section label="Proposal">
              <Journal lines={preparedEntry.lines} />
            </Section>
            <Section label="Reasoning">
              <p className="line-clamp-3 text-[13px] leading-[18px] text-ink">{explanation}</p>
            </Section>
            <Section label="Confidence">
              <span className="flex items-center gap-2 text-[13px]">
                <ConfidenceBar value={0.94} /> High
              </span>
            </Section>
          </>
        )}
        {id === "bazaar" && (
          <>
            <Section label="Issue">
              <p className="text-[14px] font-semibold leading-[20px]">No receipt for card payment at Bazaar Lane Online</p>
            </Section>
            <Section label="Evidence">
              <Fields
                rows={[
                  ["Bank line", `${bazaarLine.description} · ${bazaarLine.date}`],
                  ["Amount", `AED ${aed(bazaarLine.amount)}`],
                  ["Document", answered ? `${portalQuestion.photo} · ${bazaarInvoice.number}` : "None found"],
                ]}
              />
            </Section>
            <Section label="Proposal">
              {answered ? (
                <Journal lines={bazaarEntry} />
              ) : (
                <p className="text-[13px] leading-[18px] text-ink">Ask the client what the payment was for, and for the invoice.</p>
              )}
            </Section>
            <Section label="Reasoning">
              <p className="line-clamp-3 text-[13px] leading-[18px] text-ink">
                {answered
                  ? `The client sent ${portalQuestion.photo} (${bazaarInvoice.number}, AED ${aed(bazaarInvoice.gross)}), so oneth proposes settling the payment against it.`
                  : "No receipt or invoice matches this card payment, so oneth can't propose an entry yet. It drafted a question for the client."}
              </p>
            </Section>
            <Section label="Confidence">
              <span className="flex items-center gap-2 text-[13px]">
                <ConfidenceBar value={0.41} /> Low
              </span>
            </Section>
          </>
        )}
        {id === "manara" && (
          <>
            <Section label="Issue">
              <p className="text-[14px] font-semibold leading-[20px]">Two open bills match AED {aed(alManaraLine.amount)} to Al Manara Catering</p>
            </Section>
            <Section label="Evidence">
              <Fields
                rows={[
                  ["Bank line", `${alManaraLine.description} · ${alManaraLine.date}`],
                  ["Amount", `AED ${aed(alManaraLine.amount)}`],
                  ["Open bills", "AMC-3391 and AMC-3402, same amount"],
                ]}
              />
            </Section>
            <Section label="Proposal">
              <p className="text-[13px] leading-[18px] text-ink">
                {w.manara ? `Settle ${w.manara} with this payment.` : "Settle AMC-3391 with this payment, if you agree."}
              </p>
            </Section>
            <Section label="Reasoning">
              <p className="line-clamp-3 text-[13px] leading-[18px] text-ink">
                Both open Al Manara Catering bills are AED {aed(alManaraLine.amount)}, so the amount can&apos;t tell them apart. AMC-3391 is older,
                but this client has paid Al Manara early before.
              </p>
            </Section>
            <Section label="Confidence">
              <span className="flex items-center gap-2 text-[13px]">
                <ConfidenceBar value={0.52} /> Low
              </span>
            </Section>
          </>
        )}
      </div>
    </AppCard>
  );
}

function ActionsCard({ id, w, actions, className = "" }: { id: StoryId; w: World; actions: StoryActions; className?: string }) {
  const next = nextOpen(w);
  const st = status(id, w);
  let body: ReactNode;

  if (decided(id, w)) {
    body = (
      <>
        <span className="flex items-center gap-2">
          <Chip tone={st.tone}>
            <Check {...ICON_SM} /> {st.label}
          </Chip>
          <span className="text-[13px] text-muted">Just now, by you</span>
        </span>
        <p className="text-[13px] leading-[18px] text-muted">Recorded with its evidence. {NOT_WRITTEN}</p>
        {next ? (
          <PillButton onClick={() => actions.openDecision(next)} className="self-start" data-guide="next-decision">
            Next decision <ArrowRight {...ICON_SM} />
          </PillButton>
        ) : (
          <>
            <p className="text-[13px] font-semibold leading-[18px] text-ink">{client.short}&apos;s to-do list is clear.</p>
            <PillButton onClick={() => actions.navigate("close", { period: SG_NOVEMBER })} className="self-start" data-guide="see-november">
              See November <ArrowRight {...ICON_SM} />
            </PillButton>
          </>
        )}
      </>
    );
  } else if (id === "bazaar" && w.bazaar === "open") {
    body = (
      <>
        <p className="text-[13px] font-semibold leading-[18px]">Question for the client</p>
        <p className="rounded-app-tile bg-line-soft px-3 py-2.5 text-[13px] leading-[18px] text-ink">{portalQuestion.message}</p>
        <p className="text-[12px] leading-[16px] text-muted">They see it in their portal, in plain words. Their answer comes back to this decision.</p>
        <PillButton onClick={actions.sendRequest} className="self-start" data-guide="send-request">
          <Send {...ICON_SM} /> Send to the client
        </PillButton>
      </>
    );
  } else if (id === "bazaar" && w.bazaar === "asked") {
    body = (
      <>
        <Chip tone="progress" className="self-start">
          Waiting for the client
        </Chip>
        <p className="text-[13px] leading-[18px] text-muted">
          Sent to {client.contactName} in the client portal. oneth reads the answer as soon as it arrives.
        </p>
      </>
    );
  } else if (id === "manara") {
    body = (
      <>
        <p className="text-[13px] font-semibold leading-[18px]">Choose the bill this payment settles.</p>
        <p className="text-[13px] leading-[18px] text-muted">Both are AED {aed(alManaraLine.amount)}. Check the due dates.</p>
        <PillButton variant="secondary" size="sm" className="self-start">
          Ask client
        </PillButton>
      </>
    );
  } else {
    // Open and ready for a person: the Desert Line invoice, or Bazaar Lane once the client has answered
    body = (
      <>
        <PillButton onClick={id === "desert" ? actions.approveDesert : actions.approveBazaar} className="w-full" data-guide="approve">
          <Check {...ICON_SM} /> Approve
        </PillButton>
        <span className="flex gap-2">
          <PillButton variant="secondary" size="sm" className="flex-1">
            Overturn
          </PillButton>
          <PillButton variant="secondary" size="sm" className="flex-1">
            Ask client
          </PillButton>
        </span>
        {id === "desert" && (
          <span className="flex items-center gap-2 text-[13px] text-ink">
            <span className="inline-flex size-4 items-center justify-center rounded-[4px] bg-ink text-white">
              <Check size={11} strokeWidth={2.5} />
            </span>
            Save as precedent
          </span>
        )}
        <p className="text-[12px] leading-[16px] text-muted">{NOT_WRITTEN}</p>
      </>
    );
  }

  return (
    <AppCard title="Actions" className={className}>
      <div className="flex flex-col gap-3">{body}</div>
    </AppCard>
  );
}

/* ------------------------------------------------------------------ */
/* The screen                                                          */
/* ------------------------------------------------------------------ */

export function DecisionScreen({ id, world, actions, onBack }: { id: StoryId; world: World; actions: StoryActions; onBack: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <PillButton size="sm" variant="secondary" onClick={onBack}>
          <ArrowLeft {...ICON_SM} /> Decisions
        </PillButton>
        <span className="truncate text-[13px] text-muted">
          {client.name} · decision {STORY_ORDER.indexOf(id) + 1} of {STORY_ORDER.length}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        <div data-guide={id === "desert" ? "desert-review" : undefined} className="col-span-12 grid min-h-0 grid-cols-12 gap-4 xl:col-span-9 xl:grid-cols-9">
          <div data-guide={id === "desert" ? "desert-doc" : undefined} className="col-span-5 min-h-0 xl:col-span-4">
            <DocumentColumn id={id} w={world} actions={actions} />
          </div>
          <div className="col-span-7 flex min-h-0 flex-col gap-4 xl:col-span-5">
            {/* Narrower screens: the actions lead, so Approve is always in view */}
            <ActionsCard id={id} w={world} actions={actions} className="xl:hidden" />
            <div className="min-h-0 flex-1">
              <RecordCard id={id} w={world} />
            </div>
          </div>
        </div>
        <div className="hidden min-h-0 xl:col-span-3 xl:block">
          <ActionsCard id={id} w={world} actions={actions} />
        </div>
      </div>
    </div>
  );
}
