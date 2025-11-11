"use client";

import Link from "next/link";
import { useState } from "react";

interface ProofOfWorkSectionProps {
  works?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
  }>;
}

export function ProofOfWorkSection({ works = [] }: ProofOfWorkSectionProps) {
  const isEmpty = works.length === 0;

  return (
    <div className="bg-white dark:bg-hero-dark rounded-xl p-8 border border-border-grey dark:border-dark-charcoal">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Proof of Work
        </h2>
        <button className="text-orange hover:text-orange/80 font-medium text-sm transition-colors">
          + ADD
        </button>
      </div>

      {isEmpty ? (
        <div className="py-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-smoked-white dark:bg-light-black rounded-full flex items-center justify-center">
            <div className="text-4xl text-light-charcoal dark:text-lightgrey">
              📋
            </div>
          </div>
          <p className="text-light-charcoal dark:text-lightgrey mb-6 text-lg">
            Add some proof of work to build your profile
          </p>
          <div className="flex gap-3 justify-center flex-col sm:flex-row">
            <button className="px-6 py-2.5 bg-orange text-white rounded-lg font-medium hover:bg-orange/90 transition-colors">
              Add
            </button>
            <Link href="/bounty">
              <button className="px-6 py-2.5 border-2 border-orange text-orange rounded-lg font-medium hover:bg-orange/5 transition-colors">
                Browse Bounties
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {works.map((work) => (
            <div
              key={work.id}
              className="p-4 border border-border-grey dark:border-dark-charcoal rounded-lg hover:border-orange transition-colors"
            >
              <h3 className="font-semibold text-black dark:text-white mb-2">
                {work.title}
              </h3>
              <p className="text-sm text-light-charcoal dark:text-lightgrey mb-2">
                {work.description}
              </p>
              <a
                href={work.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange hover:text-orange/80 transition-colors"
              >
                View Work →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
