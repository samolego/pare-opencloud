#!/bin/bash

# Bills file generator script
# Generates a comprehensive bills file with users, categories, payment modes, and bills in PSON format

OUTPUT_FILE="bills_data.pson"

# Create the basic PSON structure
cat > "$OUTPUT_FILE" << 'EOF'
{
  "meta": {
    "version": "1.0",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "modified": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "data": {
    "users": {
EOF

# Generate users
users=(
    "Alice Johnson" "Bob Smith" "Charlie Brown" "Diana Prince" "Edward Norton"
    "Fiona Green" "George Lucas" "Hannah Davis" "Ian Fleming" "Julia Roberts"
    "Kevin Hart" "Laura Palmer" "Michael Jordan" "Nancy Drew" "Oscar Wilde"
    "Patricia Hill" "Quentin Tarantino" "Rachel Green" "Samuel Jackson" "Tina Turner"
)

for i in {1..20}; do
    cat >> "$OUTPUT_FILE" << EOF
      "$i": {
        "name": "${users[$i-1]}",
        "opencloud_id": null,
        "balance": 0
      }$(if [ $i -lt 20 ]; then echo ","; fi)
EOF
done

cat >> "$OUTPUT_FILE" << 'EOF'
    },
    "payment_modes": {
EOF

# Generate payment modes
payment_modes=(
    "Cash" "Credit Card" "Debit Card" "Bank Transfer" "PayPal"
    "Venmo" "Zelle" "Apple Pay" "Google Pay" "Bitcoin"
    "Check" "Money Order" "Gift Card" "Store Credit" "Cryptocurrency"
    "Wire Transfer" "Mobile Payment" "Contactless" "Online Banking" "Direct Debit"
)

for i in {1..20}; do
    cat >> "$OUTPUT_FILE" << EOF
      "$i": {
        "name": "${payment_modes[$i-1]}"
      }$(if [ $i -lt 20 ]; then echo ","; fi)
EOF
done

cat >> "$OUTPUT_FILE" << 'EOF'
    },
    "categories": {
EOF

# Generate categories
categories=(
    "Food" "Transport" "Utilities" "Entertainment" "Shopping"
    "Healthcare" "Equipment" "Education" "Travel" "Insurance"
    "Rent" "Groceries" "Gas" "Clothing" "Electronics"
    "Books" "Sports" "Beauty" "Home Improvement" "Subscriptions"
)

for i in {1..20}; do
    cat >> "$OUTPUT_FILE" << EOF
      "$i": {
        "name": "${categories[$i-1]}"
      }$(if [ $i -lt 20 ]; then echo ","; fi)
EOF
done

cat >> "$OUTPUT_FILE" << 'EOF'
    },
    "bills": {
EOF

# Generate bills
items=(
    "Lunch at restaurant" "Uber ride" "Electricity bill" "Movie tickets" "Amazon order"
    "Doctor visit" "New laptop" "Online course" "Hotel booking" "Car insurance"
    "Monthly rent" "Grocery shopping" "Gas station" "New jacket" "Phone upgrade"
    "Textbooks" "Gym membership" "Skincare products" "Paint supplies" "Netflix subscription"
)

bill_id=1
current_date=$(date -u +"%Y-%m-%d")

# Generate bills for each combination of item, payment mode, and category
for item_idx in {0..19}; do
    echo "Item: $item_idx"
    for payment_idx in {1..20}; do
        for category_idx in {1..20}; do
            # Generate random amount between 10 and 500
            amount=$((RANDOM % 491 + 10))

            # Random user who paid (1-20)
            who_paid=$((RANDOM % 20 + 1))

            # Generate timestamp (Unix timestamp in milliseconds)
            # Base date: current date with random time
            hour=$((RANDOM % 14 + 9))
            minute=$((RANDOM % 60))
            timestamp=$(date -d "${current_date} $(printf "%02d:%02d" $hour $minute)" +%s)000

            # Random comment (sometimes empty)
            comments=("Great service" "Expensive but worth it" "Split evenly" "Emergency purchase" "Regular expense" "")
            comment_idx=$((RANDOM % 6))
            comment="${comments[$comment_idx]}"

            cat >> "$OUTPUT_FILE" << EOF
      "$bill_id": {
        "description": "${items[$item_idx]}",
        "total_amount": $amount,
        "who_paid_id": $who_paid,
        "timestamp": $timestamp,
        "repeat": "None",
        "payment_mode_id": $payment_idx,
        "category_id": $category_idx,
        "comment": "$comment",
        "file_link": "",
        "splits": {
EOF

            # Generate random splits for this bill
            # Randomly decide how many people are included (1-4 people)
            num_people=$((RANDOM % 4 + 1))

            # Generate random user IDs for splitting
            users_in_split=()
            while [ ${#users_in_split[@]} -lt $num_people ]; do
                user_id=$((RANDOM % 20 + 1))
                # Check if user is not already in the split
                if [[ ! " ${users_in_split[@]} " =~ " ${user_id} " ]]; then
                    users_in_split+=($user_id)
                fi
            done

            # Calculate split amounts
            base_amount=$((amount / num_people))
            remainder=$((amount % num_people))

            for i in "${!users_in_split[@]}"; do
                user_id=${users_in_split[$i]}
                user_amount=$base_amount

                # Give remainder to first users
                if [ $i -lt $remainder ]; then
                    ((user_amount++))
                fi

                cat >> "$OUTPUT_FILE" << EOF
          "$((i+1))": {
            "user_id": $user_id,
            "amount": $user_amount
          }$(if [ $i -lt $((${#users_in_split[@]} - 1)) ]; then echo ","; fi)
EOF
            done

            cat >> "$OUTPUT_FILE" << EOF
        }
      }$(if [ $bill_id -lt 8000 ]; then echo ","; fi)
EOF

            ((bill_id++))
        done
    done
done

cat >> "$OUTPUT_FILE" << 'EOF'
    }
  }
}
EOF

echo "Bills file generated successfully: $OUTPUT_FILE"
echo "Generated:"
echo "- 20 users"
echo "- 20 payment modes"
echo "- 20 categories"
echo "- 8000 bills (20 items × 20 payment modes × 20 categories)"
echo "- Corresponding bill splits with random user participation"