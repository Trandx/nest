export function jsonToKeyValue(data: object[] | object) {
  
    if ( data instanceof Object &&  !Array.isArray(data) ) {
        data = [data]
    }

    if ( !Array.isArray(data ) ) {
        throw new Error("Invalid JSON format. Ensure 'table' and 'data' are defined.");
    }
  
    const columns: string[] = [], values: string[] = [];
    
    data.forEach((row: object) => {
      const {columns: cols, values: vals} = processRow(row);
        columns.push(cols);
        values.push(vals);
    });
  
    return {columns, values};
}

function processRow(row: object, prefix = "") {
    const columns = [];
    const values = [];
  
    for (const [key, value] of Object.entries(row)) {
        
        const column = prefix ? `${prefix}.${key}` : key;

        // Handle primitive values
        columns.push(column);
        values.push(formatValue(value));

    }
  
    return { columns: columns.join(','), values: values.join(',') };
}
  
function formatValue(value: any) {
    if (typeof value === "string") {
      return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
    } else if (value === null || value === undefined) {
      return "NULL";
    } else {
      return value; // Numbers and booleans
    }
}