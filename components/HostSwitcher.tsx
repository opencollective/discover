import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';

const ChevronUpDown = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
  </svg>
);

export default function HostSwitcher({ host, hosts }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHost, setActiveHost] = useState(host);

  useEffect(() => {
    setActiveHost(host);
  }, [host]);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <Fragment>
      {' '}
      <div className="">
        <button
          type="button"
          onClick={openModal}
          className="flex cursor-pointer items-center gap-4 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-2 py-1 text-base font-medium transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
        >
          <img src={host.logoSrc} alt={host.name} className="h-4 flex-shrink-0" />
          <span className="overflow-hidden text-ellipsis">{host.name}</span>{' '}
          <ChevronUpDown className="h-6 w-6 flex-shrink-0" />
        </button>
      </div>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-4 text-left align-middle shadow-xl transition-all lg:p-8">
                  <Dialog.Title as="h3" className="mb-4 text-xl font-bold leading-6 text-gray-900">
                    Switch host
                  </Dialog.Title>
                  <div className="grid grid-cols-1 gap-4 lg:gap-6">
                    {hosts.map(host => (
                      <Link href={`/${host.slug}`} key={host.slug}>
                        <a
                          className={`flex h-24 items-center justify-start gap-3 rounded-xl border-3 px-4 lg:h-32 lg:gap-4 lg:px-6 bg-${
                            host.color
                          }-500 bg-opacity-5 transition-colors ${
                            activeHost.slug === host.slug
                              ? `border-${host.color}-500`
                              : `border-transparent hover:border-${host.color}-500`
                          }`}
                          onClick={() => {
                            closeModal();
                          }}
                        >
                          <div className="flex min-w-[64px] justify-center lg:min-w-[128px]">
                            <img src={host.logoSrc} className="h-5 lg:h-10" alt={host.name} />
                          </div>
                          <span className={`text-base font-medium lg:text-lg `}>{host.name}</span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Fragment>
  );
}
