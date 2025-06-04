import * as React from "react"

import { cn } from "@/lib/utils"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  colCount?: number;
}

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  colCount?: number;
  headers?: string[];
  caption?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, colCount, headers, caption, children, ...props }, ref) => {
    const hasHeaderRow = React.Children.toArray(children).some(
      (child) =>
        React.isValidElement(child) &&
        (child.type === TableHeader || child.type === 'thead')
    )

    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            "w-full caption-bottom text-sm text-[hsl(206,33%,16%)] font-primary",
            className
          )}
          {...(colCount ? { 'aria-colcount': colCount } : {})}
          {...props}
        >
          {caption && (
            <TableCaption className="text-left mb-2">{caption}</TableCaption>
          )}
          {!hasHeaderRow && headers && headers.length > 0 && (
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => {
                  const headerId = `header-${header.toLowerCase().replace(/\s+/g, '-')}-${index}`
                  return (
                    <TableHead key={headerId} scope="col">
                      {header}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
          )}
          {children}
        </table>
      </div>
    )
  }
)
Table.displayName = "Table"

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  rowCount?: number;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, rowCount, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "[&_tr]:border-b border-[hsl(215,16%,90%)] bg-[hsl(0,0%,98%)]",
        className
      )}
      {...(rowCount ? { 'aria-rowcount': rowCount } : {})}
      {...props}
    />
  )
)
TableHeader.displayName = "TableHeader"

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  rowCount?: number;
}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, rowCount, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn(
        "[&_tr:last-child]:border-0",
        className
      )}
      {...(rowCount ? { 'aria-rowcount': rowCount } : {})}
      {...props}
    />
  )
)
TableBody.displayName = "TableBody"

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  rowCount?: number;
}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, rowCount, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "bg-[hsl(0,0%,98%)] font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...(rowCount ? { 'aria-rowcount': rowCount } : {})}
      {...props}
    />
  )
)
TableFooter.displayName = "TableFooter"

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'aria-rowindex'?: number;
  'aria-selected'?: boolean | 'false' | 'true';
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-[hsl(215,16%,90%)] transition-colors hover:bg-[hsl(0,0%,98%)]/50 data-[state=selected]:bg-[hsl(0,0%,98%)]",
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
  colSpan?: number;
  rowSpan?: number;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, scope = 'col', ...props }, ref) => (
    <th
      ref={ref}
      scope={scope}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-[hsl(215,14%,34%)] [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  colSpan?: number;
  rowSpan?: number;
  headers?: string;
  'aria-colindex'?: number;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  position?: 'top' | 'bottom';
}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, position = 'bottom', ...props }, ref) => (
    <caption
      ref={ref}
      className={cn(
        position === 'top' ? 'mb-4' : 'mt-4',
        "text-sm text-[hsl(220,14%,46%)]",
        className
      )}
      {...props}
    />
  )
)
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
