'use client'

import { useState } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  printOnly?: boolean
}

export default function Modal({ isOpen, onClose, title, children, printOnly = false }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${printOnly ? 'print:fixed print:inset-0 print:z-50 print:overflow-visible' : ''}`}>
      <div className={`flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 ${printOnly ? 'print:flex print:items-start print:justify-start print:min-h-0 print:pt-0 print:px-0 print:pb-0 print:text-left print:block print:p-0' : ''}`}>
        <div className={`fixed inset-0 transition-opacity ${printOnly ? 'print:hidden' : ''}`} aria-hidden="true">
          <div className={`absolute inset-0 bg-gray-500 opacity-75 ${printOnly ? 'print:bg-transparent print:opacity-0' : ''}`} onClick={onClose}></div>
        </div>

        <span className={`hidden sm:inline-block sm:align-middle sm:h-screen ${printOnly ? 'print:hidden' : ''}`} aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full modal-content ${printOnly ? 'print:inline-block print:align-top print:bg-white print:rounded-none print:text-left print:overflow-visible print:shadow-none print:transform-none print:my-0 print:align-top print:max-w-none print:w-full' : ''}`}>
          <div className={`bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${printOnly ? 'print:bg-white print:px-0 print:pt-0 print:pb-0 print:sm:p-0 print:sm:pb-0' : ''}`}>
            <div className={`flex items-center justify-between mb-4 ${printOnly ? 'print:hidden' : ''}`}>
              <h3 className="text-lg font-medium text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
