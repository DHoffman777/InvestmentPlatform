#!/bin/bash

echo "Repairing validation middleware syntax..."

# Fix broken body() calls
find . -name "*.ts" -type f | while read file; do
    if grep -q "body.*as any\." "$file" 2>/dev/null; then
        echo "  Repairing $(basename $file)..."
        # Fix patterns like: body('name') as any.notEmpty()
        # Should be: (body('name').notEmpty() as any)
        sed -i 's/body(\([^)]*\)) as any\.\([^,]*\)/\(body(\1).\2 as any\)/g' "$file"
        sed -i 's/param(\([^)]*\)) as any\.\([^,]*\)/\(param(\1).\2 as any\)/g' "$file"
        sed -i 's/query(\([^)]*\)) as any\.\([^,]*\)/\(query(\1).\2 as any\)/g' "$file"
    fi
done

echo "Repair completed!"