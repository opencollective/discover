// TODO: fix these
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';

export default function HostSwitcher({ children, hosts, platformTotalCollectives, locale }) {
  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <Fragment>
      <a
        // This is a link since it needs to break with the text, TODO: fix suggestion
        onClick={openModal}
        className={`group cursor-pointer`}
      >
        {children}
      </a>

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
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-4 text-left align-middle shadow-xl transition-all lg:p-8">
                  <Dialog.Title as="h3" className="mb-4 text-xl font-bold leading-6 text-gray-900">
                    Select host
                  </Dialog.Title>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    {hosts.map(host => (
                      <Link href={`/${host.slug}`} key={host.slug}>
                        <a
                          key={host.slug}
                          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-3 p-6 text-center lg:h-60 lg:gap-6 ${host.styles.box} border-transparent transition-colors`}
                          onClick={() => {
                            closeModal();
                          }}
                        >
                          <span className={`text-base font-bold lg:text-lg ${host.styles.text}`}>
                            {host.root ? 'All verified hosts on' : host.name}
                          </span>
                          <img src={host.logoSrc} className="h-6 lg:h-10" alt={host.name} />
                          <div>
                            <p className="underline">{host.count.toLocaleString(locale)} collectives</p>
                            {host.root && (
                              <p className="text-sm">
                                out of {platformTotalCollectives.toLocaleString(locale)} in total
                              </p>
                            )}
                          </div>
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
