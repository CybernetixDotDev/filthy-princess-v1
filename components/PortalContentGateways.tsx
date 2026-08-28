"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  PortalContentBlock,
  PortalContentTile,
  RetreatExperience,
  fallbackExperienceTile,
  normalizeRetreatExperience,
  portalContentTiles,
  retreatExperienceContent,
  retreatExperienceOrder,
} from "@/lib/portal/content";

type PortalContentGatewaysProps = {
  retreatType: string | null;
};

const whatToExpectId = "what-to-expect";

function renderBlocks(blocks: PortalContentBlock[]) {
  return blocks.map((block, index) => {
    if (block.kind === "emphasis") {
      return (
        <p className="portal-modal-emphasis" key={`emphasis-${index}`}>
          {block.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      );
    }

    return <p key={`paragraph-${index}`}>{block.text}</p>;
  });
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

export default function PortalContentGateways({
  retreatType,
}: PortalContentGatewaysProps) {
  const selectedExperience = normalizeRetreatExperience(retreatType);
  const initialExperience = selectedExperience ?? "custom";
  const [openTileId, setOpenTileId] = useState<string | null>(null);
  const [activeExperience, setActiveExperience] =
    useState<RetreatExperience>(initialExperience);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const whatToExpectTile = useMemo(() => {
    const selectedContent = selectedExperience
      ? retreatExperienceContent[selectedExperience]
      : null;

    return {
      id: whatToExpectId,
      eyebrow: "YOUR EXPERIENCE",
      title: selectedContent?.tileTitle ?? fallbackExperienceTile.title,
      teaser: selectedContent?.tileTeaser ?? fallbackExperienceTile.teaser,
    };
  }, [selectedExperience]);

  const tiles = useMemo(
    () => [
      portalContentTiles[0],
      portalContentTiles[1],
      whatToExpectTile,
      ...portalContentTiles.slice(2),
    ],
    [whatToExpectTile],
  );

  const openTile = tiles.find((tile) => tile.id === openTileId) ?? null;
  const isWhatToExpectOpen = openTileId === whatToExpectId;
  const activeExperienceContent = retreatExperienceContent[activeExperience];
  const modalTitleId = "portal-content-modal-title";

  function openContentTile(tileId: string) {
    setOpenTileId(tileId);

    if (tileId === whatToExpectId) {
      setActiveExperience(initialExperience);
    }
  }

  const closeModal = useCallback(() => {
    const trigger = openTileId ? triggerRefs.current[openTileId] : null;
    setOpenTileId(null);
    trigger?.focus();
  }, [openTileId]);

  useEffect(() => {
    if (!openTileId) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(modalRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, openTileId]);

  return (
    <section className="portal-rooms" aria-labelledby="rooms-title">
      <div className="portal-section-heading">
        <p className="section-kicker">Private rooms</p>
        <h2 id="rooms-title">While you are here</h2>
      </div>

      <div className="portal-room-grid">
        {tiles.map((tile) => (
          <button
            className="portal-room"
            key={tile.id}
            type="button"
            ref={(element) => {
              triggerRefs.current[tile.id] = element;
            }}
            onClick={() => openContentTile(tile.id)}
          >
            <span className="portal-room-eyebrow">{tile.eyebrow}</span>
            <span className="portal-room-title">{tile.title}</span>
            <span className="portal-room-teaser">{tile.teaser}</span>
            <span className="portal-room-open" aria-hidden="true">
              Open
            </span>
          </button>
        ))}
      </div>

      {openTile ? (
        <div
          className="portal-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="portal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            ref={modalRef}
          >
            <button
              className="portal-modal-close"
              type="button"
              aria-label="Close modal"
              ref={closeButtonRef}
              onClick={closeModal}
            >
              X
            </button>

            {isWhatToExpectOpen ? (
              <>
                <p className="portal-modal-eyebrow">WHAT TO EXPECT</p>
                <div
                  className="portal-experience-tabs"
                  role="tablist"
                  aria-label="Retreat experience options"
                >
                  {retreatExperienceOrder.map((experience) => {
                    const content = retreatExperienceContent[experience];

                    return (
                      <button
                        aria-controls={`experience-panel-${experience}`}
                        aria-selected={activeExperience === experience}
                        className="portal-experience-tab"
                        id={`experience-tab-${experience}`}
                        key={experience}
                        role="tab"
                        type="button"
                        onClick={() => setActiveExperience(experience)}
                      >
                        {content.label}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="portal-modal-content"
                  id={`experience-panel-${activeExperience}`}
                  role="tabpanel"
                  aria-labelledby={`experience-tab-${activeExperience}`}
                >
                  <h2 id={modalTitleId}>{activeExperienceContent.modalTitle}</h2>
                  {renderBlocks(activeExperienceContent.content)}
                </div>
              </>
            ) : (
              <>
                <p className="portal-modal-eyebrow">
                  {(openTile as PortalContentTile).eyebrow}
                </p>
                <div className="portal-modal-content">
                  <h2 id={modalTitleId}>
                    {(openTile as PortalContentTile).modalTitle}
                  </h2>
                  {renderBlocks((openTile as PortalContentTile).content)}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
