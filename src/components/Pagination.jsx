import React from "react";
import { GrFormNextLink } from "react-icons/gr";
import { GrFormPreviousLink } from "react-icons/gr";

const Pagination = ({ current_page, total_pages, onPageChange }) => {

  const generatePages = () => {
    const pages = [];

    for (let i = 1; i <= total_pages; i++) {
      if (
        i === 1 ||
        i === total_pages ||
        (i >= current_page - 1 && i <= current_page + 1)
      ) {
        pages.push(i);
      } else if (
        i === current_page - 2 ||
        i === current_page + 2
      ) {
        pages.push("...");
      }
    }

    // duplicate "..." larni tozalash
    return pages.filter((item, index) =>
      item !== "..." || pages[index - 1] !== "..."
    );
  };

  const pages = generatePages();

  return (
    <div className="flex items-center justify-center gap-2 mt-10">

      {/* Prev */}
      <button
        disabled={current_page === 1}
        onClick={() => onPageChange(current_page - 1)}
        className="px-3 py-1 rounded-lg bg-gray-200 disabled:opacity-50 cursor-pointer"
      >
        <GrFormPreviousLink className="text-xl" />
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={index} className="px-2 cursor-pointer">
            ...
          </span>
        ) : (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-lg transition cursor-pointer
              ${
                page === current_page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        disabled={current_page === total_pages}
        onClick={() => onPageChange(current_page + 1)}
        className="px-3 py-1 rounded-lg bg-gray-200 disabled:opacity-50 cursor-pointer"
      >
        <GrFormNextLink className="text-xl" />
      </button>

    </div>
  );
};

export default Pagination;