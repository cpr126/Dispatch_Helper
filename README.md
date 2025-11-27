🚛 Uni Dispatch Helper (TNO Tracker)

The Uni Dispatch Helper is a single-page web application designed to streamline the package manifest processing and live scanning workflow for dispatch operations. It efficiently identifies problem packages (Wrong Driver ID, Wrong State, High Scan Count, and Mail Innovations) and provides instant feedback during the scanning process.

✨ Features

Manifest Processing: Extracts and categorizes all Tracking Numbers (TNOs) from raw manifest data.

Problem Identification: Automatically flags TNOs associated with specific driver IDs, state codes, high scan counts (>= 3), or those designated as Mail Innovations (MI) packages.

Live Scanning: Tracks scanned TNOs in real-time against the manifest.

Instant Status Feedback: Provides immediate visual feedback (color-coded status bar) on the last scanned package.

✅ OK (Green): On manifest, not a problem package.

⚠️ PROBLEM (Yellow): On manifest, flagged as a problem (Driver, State, Scans, or MI).

ℹ️ NOT IN LIST (Indigo): Not found on the current manifest.

Scanned Problem Log (5c): Keeps a list of all problem packages successfully scanned, including the specific reason for the flag (e.g., driver: 270991 or scans: 7).

Remaining TNOs (5b): Dynamically updates a list of packages still needing to be scanned. Problem TNOs are marked with an 🚨 prefix.

Problem TNO Lookup (Section 6): Allows quick searching of any TNO to instantly retrieve its status and the specific reason it was flagged as a problem, without needing to scan it.

One-Click Copying: Dedicated buttons for copying lists of All TNOs, Problem TNOs, MI TNOs, Remaining TNOs, and Scanned Problem TNOs.

Responsive Design: Built using Tailwind CSS for a dark-themed, responsive interface.

🛠️ How to Use

1. Load Manifest Data (Section 1)

Copy the raw package manifest data (including TNOs, Driver IDs, States, Scan Counts, etc.) from your source system.

Paste the raw data into the Manifest Data (1.) textarea.

The system will automatically process the data and populate sections 2, 3, 4, and 5b.

2. Live Scanning (Section 5)

Ensure your cursor is in the Scan Here (5a) textarea.

Begin scanning packages.

The Dynamic Status Bar will provide instant feedback on the last scanned TNO.

If a problem package is scanned, it will appear in the Scanned Problem Packages (5c) list along with its reason.

3. TNO Lookup (Section 6)

Enter any TNO (or paste it directly) into the Enter TNO to check reason input box.

The Result / Reason box will immediately display the TNO's status (PROBLEM, OK, or UNKNOWN) and the cause of any problem flag.

⚙️ Development Stack

The Uni Dispatch Helper is a highly efficient single-file web application built with:

HTML5: The core structure.

JavaScript (Vanilla JS): Handles all the logic, state management (using Set and Map), TNO extraction, and real-time scanning.

Tailwind CSS (via CDN): Used for all modern, dark-themed, and responsive styling.
