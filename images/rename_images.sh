#!/bin/bash

# Define source and destination folders
SRC_DIR="images"
DEST_DIR="images/products"

# Declare a list of original file names and desired new names
declare -A files=(
  ["JNS0135911.webp"]="lehenga-style-1.webp"
  ["JSM0136311.webp"]="lehenga-style-2.webp"
  ["JUTW127.webp"]="lehenga-style-3.webp"
  ["JUTW133.webp"]="gown-style-1.webp"
  ["LSTV03368.webp"]="gown-style-2.webp"
  ["LSTV125834.webp"]="gown-style-3.webp"
  ["LSTV125927.webp"]="gown-style-4.webp"
  ["LSTV127805.webp"]="gown-style-5.webp"
  ["SARV172788.webp"]="anarkali-style-1.webp"
  ["UL5003VD_443-415-DUSTY+PINK-LIGHT+PINK_301.webp"]="anarkali-style-2.webp"
  ["wedding-lehenga-1.jpg"]="wedding-lehenga-1.jpg"
  ["wedding-lehenga-2.jpg"]="wedding-lehenga-2.jpg"
)

# Move and rename the files
for original in "${!files[@]}"; do
  if [[ -f "$SRC_DIR/$original" ]]; then
    mv "$SRC_DIR/$original" "$DEST_DIR/${files[$original]}"
    echo "Moved: $original -> ${files[$original]}"
  else
    echo "Warning: $original not found in $SRC_DIR"
  fi
done

