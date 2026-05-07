package com.vn.ecommerce_backend.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public class PageResponse <T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;
    private boolean first;
    private boolean empty;
    private boolean sorted;
    private String sortBy;
    private String sortDir;

    public List<T> getContent() {
        return content;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public int getPageSize() {
        return pageSize;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public boolean isLast() {
        return last;
    }

    public boolean isFirst() {
        return first;
    }

    public boolean isEmpty() {
        return empty;
    }

    public boolean isSorted() {
        return sorted;
    }

    public String getSortDir() {
        return sortDir;
    }

    public String getSortBy() {
        return sortBy;
    }
}
