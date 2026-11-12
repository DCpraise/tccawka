"use client";

import { motion } from "framer-motion";
import { CHURCH_CONTACT } from "@/lib/site-data";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.386.703 4.605 1.912 6.473L4 29l7.72-1.876A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818c-1.86 0-3.598-.51-5.09-1.397l-.365-.217-4.583 1.113 1.155-4.463-.238-.377A9.77 9.77 0 0 1 5.2 15c0-5.965 4.847-10.818 10.804-10.818S26.808 9.035 26.808 15 21.961 24.818 16.004 24.818Zm5.936-8.14c-.325-.163-1.92-.947-2.217-1.056-.297-.109-.513-.163-.729.163-.216.326-.837 1.056-1.026 1.273-.189.217-.378.244-.703.081-.325-.163-1.372-.505-2.613-1.61-.966-.86-1.618-1.922-1.807-2.248-.189-.326-.02-.502.143-.664.146-.146.325-.38.487-.57.163-.19.216-.326.325-.543.108-.217.054-.407-.027-.57-.081-.163-.729-1.758-.998-2.407-.263-.632-.53-.546-.729-.556-.189-.009-.406-.011-.622-.011-.216 0-.567.081-.864.407-.297.326-1.134 1.108-1.134 2.703 0 1.595 1.161 3.135 1.323 3.35.163.217 2.287 3.492 5.542 4.897.774.334 1.377.534 1.848.684.776.247 1.483.212 2.041.129.623-.093 1.92-.785 2.19-1.543.271-.759.271-1.409.19-1.543-.081-.135-.298-.217-.623-.38Z" />
    </svg>
  );
}

export function WhatsAppButton() {
  return (
    <motion.a
      href={CHURCH_CONTACT.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/25 md:h-16 md:w-16"
    >
      <WhatsAppIcon className="h-7 w-7 md:h-8 md:w-8" />
    </motion.a>
  );
}
