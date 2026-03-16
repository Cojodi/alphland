import React from "react";

const sortByAttribute = (data: DappCard[], sortBy: string | null) => {
  if (sortBy === "A-Z") {
    return data.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortBy === "Z-A") {
    return data.sort((a, b) => b.title.localeCompare(a.title));
  }
  if (sortBy === "Newest") {
    return data.sort((a, b) => {
      const dateA = a.founded ? new Date(a.founded).getTime() : 0;
      const dateB = b.founded ? new Date(b.founded).getTime() : 0;
      return dateB - dateA; // Descending (newest first)
    });
  }
  if (sortBy === "Oldest") {
    return data.sort((a, b) => {
      const dateA = a.founded ? new Date(a.founded).getTime() : 0;
      const dateB = b.founded ? new Date(b.founded).getTime() : 0;
      return dateA - dateB; // Ascending (oldest first)
    });
  }
  return data;
};

export default sortByAttribute;
