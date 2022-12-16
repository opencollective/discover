import React from 'react';

import HostSwitcher from './HostSwitcher';

export default function Header({ hosts, platformTotalCollectives, locale, host, categories, filter, setFilter }) {
  return (
    <div className={`w-full bg-white p-6 lg:col-span-3 lg:mx-0 lg:rounded-lg lg:p-10 ${host.root && 'lg:pb-6'}`}>
      <h1 className="text-[24px] font-bold leading-tight text-[#111827] lg:text-[40px]">
        <span>Discover {host.count.toLocaleString(locale)}</span>
        {host.root && (
          <span className={`relative -top-2 -mx-0.5 select-none text-gray-400 lg:text-gray-300`}>*</span>
        )}{' '}
        <span>collectives</span>{' '}
        <HostSwitcher hosts={hosts} platformTotalCollectives={platformTotalCollectives} locale={locale}>
          <span className="-ml-1 select-none text-[32px] font-medium leading-[0px] text-gray-400 transition-colors group-hover:text-gray-800 lg:text-[50px] lg:text-gray-300">
            [
          </span>
          <span>{host.slug ? 'hosted by ' : 'on '}</span>
          <span
            className={`relative underline decoration-3 underline-offset-3 transition-colors lg:decoration-4 lg:underline-offset-4 ${host.styles.text}`}
          >
            {host.name}
          </span>
          <span className="select-none text-[20px] leading-[0px] text-gray-400 transition-colors group-hover:text-gray-800 lg:text-[30px] lg:text-gray-300">
            ▼
          </span>
          <span className="-mr-1 select-none text-[32px] font-medium leading-[0px] text-gray-400 transition-colors group-hover:text-gray-800 lg:text-[50px] lg:text-gray-300 ">
            ]
          </span>
        </HostSwitcher>{' '}
        <span>making an impact in</span>{' '}
        <span className="">
          {categories
            .filter(c => c.tag !== 'ALL')
            .map((cat, i, arr) => (
              <React.Fragment key={cat.label}>
                <span className="whitespace-nowrap">
                  <button
                    className={`inline-block whitespace-nowrap underline decoration-3 underline-offset-3 transition-colors lg:decoration-4 lg:underline-offset-4 ${
                      filter.tag !== 'ALL' && filter.tag !== cat.tag
                        ? `decoration-transparent hover:decoration-${cat.tw}-500`
                        : `decoration-${cat.tw}-500`
                    }`}
                    onClick={() => setFilter({ tag: cat.tag })}
                  >
                    {cat.label.toLowerCase()}
                  </button>
                  {arr.length - 1 === i ? '' : ','}
                </span>
                {` `}
              </React.Fragment>
            ))}
        </span>
        <span>and more.</span>
      </h1>
      {host.root && (
        <p className="mt-2 text-sm text-gray-600">
          * out of {platformTotalCollectives.toLocaleString(locale)} collectives on Open Collective. Data from verified
          Fiscal Hosts.
        </p>
      )}
    </div>
  );
}
