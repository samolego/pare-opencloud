#!/bin/bash

# Bills file generator script
# Generates a comprehensive bills file with users, categories, payment modes, and bills

OUTPUT_FILE="bills_data.pcsv"

# Clear the output file
> "$OUTPUT_FILE"

# Generate users table
echo "TABLE,users" >> "$OUTPUT_FILE"
echo "id,name,opencloud_id,balance" >> "$OUTPUT_FILE"

users=(
    "Alice Johnson" "Bob Smith" "Charlie Brown" "Diana Prince" "Edward Norton"
    "Fiona Green" "George Lucas" "Hannah Davis" "Ian Fleming" "Julia Roberts"
    "Kevin Hart" "Laura Palmer" "Michael Jordan" "Nancy Drew" "Oscar Wilde"
    "Patricia Hill" "Quentin Tarantino" "Rachel Green" "Samuel Jackson" "Tina Turner"
)

for i in {1..20}; do
    echo "$i,${users[$i-1]},,0.00" >> "$OUTPUT_FILE"
done
echo "" >> "$OUTPUT_FILE"

# Generate payment_mode table
echo "TABLE,payment_mode" >> "$OUTPUT_FILE"
echo "id,name" >> "$OUTPUT_FILE"

payment_modes=(
    "Cash" "Credit Card" "Debit Card" "Bank Transfer" "PayPal"
    "Venmo" "Zelle" "Apple Pay" "Google Pay" "Bitcoin"
    "Check" "Money Order" "Gift Card" "Store Credit" "Cryptocurrency"
    "Wire Transfer" "Mobile Payment" "Contactless" "Online Banking" "Direct Debit"
)

for i in {1..20}; do
    echo "$i,${payment_modes[$i-1]}" >> "$OUTPUT_FILE"
done
echo "" >> "$OUTPUT_FILE"

# Generate category table
echo "TABLE,category" >> "$OUTPUT_FILE"
echo "id,name" >> "$OUTPUT_FILE"

categories=(
    "Food" "Transport" "Utilities" "Entertainment" "Shopping"
    "Healthcare" "Equipment" "Education" "Travel" "Insurance"
    "Rent" "Groceries" "Gas" "Clothing" "Electronics"
    "Books" "Sports" "Beauty" "Home Improvement" "Subscriptions"
)

for i in {1..20}; do
    echo "$i,${categories[$i-1]}" >> "$OUTPUT_FILE"
done
echo "" >> "$OUTPUT_FILE"

# Generate bills table
echo "TABLE,bills" >> "$OUTPUT_FILE"
echo "id,description,total_amount,who_paid_id,timestamp,repeat,payment_mode_id,category_id,comment,file_link" >> "$OUTPUT_FILE"

items=(
    "Lunch at restaurant" "Uber ride" "Electricity bill" "Movie tickets" "Amazon order"
    "Doctor visit" "New laptop" "Online course" "Hotel booking" "Car insurance"
    "Monthly rent" "Grocery shopping" "Gas station" "New jacket" "Phone upgrade"
    "Textbooks" "Gym membership" "Skincare products" "Paint supplies" "Netflix subscription"
)

bill_id=1
current_date="2025-08-06"

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
            # Base date: 2025-08-06 with random time
            hour=$((RANDOM % 14 + 9))
            minute=$((RANDOM % 60))
            timestamp=$(date -d "${current_date} $(printf "%02d:%02d" $hour $minute)" +%s)000

            # Random comment (sometimes empty)
            comments=("Great service" "Expensive but worth it" "Split evenly" "Emergency purchase" "Regular expense" "")
            comment_idx=$((RANDOM % 6))
            comment="${comments[$comment_idx]}"

            echo "$bill_id,${items[$item_idx]},$amount,$who_paid,$timestamp,None,$payment_idx,$category_idx,$comment," >> "$OUTPUT_FILE"
            ((bill_id++))
        done
    done
done
echo "" >> "$OUTPUT_FILE"

# Generate bill_splits table
echo "TABLE,bill_splits" >> "$OUTPUT_FILE"
echo "id,bill_id,user_id,amount" >> "$OUTPUT_FILE"

split_id=1
total_bills=$((20 * 20 * 20))  # 8000 bills

# For each bill, generate splits
for bill_id in $(seq 1 $total_bills); do
    # Get the bill amount (we need to calculate this based on our generation logic)
    amount=$((RANDOM % 491 + 10))

    # Randomly decide how many people are included (2-4 people)
    num_people=$((RANDOM % 3 + 2))

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

        echo "$split_id,$bill_id,$user_id,$user_amount" >> "$OUTPUT_FILE"
        ((split_id++))
    done


done

echo "Bills file generated successfully: $OUTPUT_FILE"
echo "Generated:"
echo "- 20 users"
echo "- 20 payment modes"
echo "- 20 categories"
echo "- $total_bills bills (20 items × 20 payment modes × 20 categories)"
echo "- Corresponding bill splits with random user participation"
