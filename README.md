# Revenue Planning Tool

A web-based tool for planning and tracking revenue targets, calculating required sales activities, and visualizing progress. This tool helps sales teams and businesses plan their activities to meet revenue goals.

## Features

- Set monthly revenue targets and track realized revenue
- Automatic calculation of required leads, demos, and deals
- Visual breakdown of existing vs new revenue needed
- Track sales activity trends over time
- Account for payment delays and existing revenue growth
- Save and load different scenarios
- Responsive design that works on all devices

## Usage

1. **Set Your Parameters:**
   - Adjust conversion rates (Lead to Customer, Demo to Customer)
   - Set average customer payment amount
   - Configure payment delay in days
   - Enter base monthly existing revenue and growth rate

2. **Enter Monthly Targets:**
   - Input desired revenue targets for each month
   - Enter realized revenue for past months to track progress

3. **Track Progress:**
   - View the cumulative gap between targets and realized revenue
   - See adjusted targets for remaining months
   - Monitor required sales activities

4. **Save Scenarios:**
   - Save different sets of parameters and targets
   - Compare various scenarios
   - Delete scenarios you no longer need

## Charts

The tool provides two main visualizations:

1. **Revenue Breakdown Chart:**
   - Shows the split between existing and new revenue needed
   - Hover over bars to see detailed monthly values

2. **Activity Trends Chart:**
   - Displays required leads, demos, and deals over time
   - Accounts for payment delay in trend calculations
   - Hover over lines to see monthly requirements

## Local Development

To run this tool locally:

1. Clone the repository
2. Open `index.html` in your web browser
3. No build process or server required

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- D3.js for visualizations
- Local Storage for scenario management

## License

MIT License - feel free to use and modify as needed. 