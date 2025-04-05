document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Get elements
    const resultsSummary = document.getElementById('resultsSummary');
    const revenueChartContainer = document.getElementById('revenueChart');
    const trendsChartContainer = document.getElementById('trendsChart');
    const monthlyGrid = document.querySelector('.monthly-grid');
    const scenarioSelect = document.getElementById('scenarioSelect');
    const saveScenarioBtn = document.getElementById('saveScenario');
    const deleteScenarioBtn = document.getElementById('deleteScenario');
    
    // Scenario Management
    function loadScenarios() {
        const scenarios = JSON.parse(localStorage.getItem('scenarios') || '{}');
        scenarioSelect.innerHTML = '<option value="">Load Scenario...</option>';
        Object.keys(scenarios).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            scenarioSelect.appendChild(option);
        });
    }
    
    function saveScenario() {
        const name = prompt('Enter a name for this scenario:');
        if (!name) return;
        
        const scenarios = JSON.parse(localStorage.getItem('scenarios') || '{}');
        scenarios[name] = {
            leadToCustomerRate: document.getElementById('leadToCustomerRate').value,
            demoToCustomerRate: document.getElementById('demoToCustomerRate').value,
            customerPayment: document.getElementById('customerPayment').value,
            paymentDelay: document.getElementById('paymentDelay').value,
            existingRevenue: document.getElementById('existingRevenue').value,
            existingGrowth: document.getElementById('existingGrowth').value,
            monthlyTargets: Array.from(document.querySelectorAll('[id^="target-"]')).map(input => input.value),
            realizedRevenue: Array.from(document.querySelectorAll('[id^="realized-"]')).map(input => input ? input.value : null)
        };
        
        localStorage.setItem('scenarios', JSON.stringify(scenarios));
        loadScenarios();
        scenarioSelect.value = name;
    }
    
    function loadScenario(name) {
        if (!name) return;
        
        const scenarios = JSON.parse(localStorage.getItem('scenarios') || '{}');
        const scenario = scenarios[name];
        if (!scenario) return;
        
        document.getElementById('leadToCustomerRate').value = scenario.leadToCustomerRate;
        document.getElementById('demoToCustomerRate').value = scenario.demoToCustomerRate;
        document.getElementById('customerPayment').value = scenario.customerPayment;
        document.getElementById('paymentDelay').value = scenario.paymentDelay;
        document.getElementById('existingRevenue').value = scenario.existingRevenue;
        document.getElementById('existingGrowth').value = scenario.existingGrowth;
        
        scenario.monthlyTargets.forEach((value, index) => {
            const input = document.getElementById(`target-${index}`);
            if (input) input.value = value;
        });
        
        scenario.realizedRevenue.forEach((value, index) => {
            const input = document.getElementById(`realized-${index}`);
            if (input && value !== null) input.value = value;
        });
        
        updateCalculations();
    }
    
    function deleteScenario() {
        const name = scenarioSelect.value;
        if (!name) return;
        
        if (!confirm(`Are you sure you want to delete the scenario "${name}"?`)) return;
        
        const scenarios = JSON.parse(localStorage.getItem('scenarios') || '{}');
        delete scenarios[name];
        localStorage.setItem('scenarios', JSON.stringify(scenarios));
        loadScenarios();
        scenarioSelect.value = '';
    }
    
    // Event listeners for scenario management
    saveScenarioBtn.addEventListener('click', saveScenario);
    deleteScenarioBtn.addEventListener('click', deleteScenario);
    scenarioSelect.addEventListener('change', () => loadScenario(scenarioSelect.value));
    
    // Create monthly rows
    function createMonthlyRows() {
        // Clear existing rows except headers
        const existingRows = document.querySelectorAll('.monthly-grid > div:not(.month-header)');
        existingRows.forEach(row => row.remove());
        
        months.forEach((month, index) => {
            // Month name
            const monthCell = document.createElement('div');
            monthCell.className = 'month-name';
            monthCell.textContent = month;
            
            // Revenue target input
            const targetCell = document.createElement('div');
            const targetInput = document.createElement('input');
            targetInput.type = 'number';
            targetInput.min = '0';
            targetInput.value = '100000';
            targetInput.id = `target-${index}`;
            targetInput.addEventListener('input', updateCalculations);
            targetCell.appendChild(targetInput);
            
            // Display for adjusted target
            const adjustedTarget = document.createElement('div');
            adjustedTarget.className = 'adjusted-target';
            adjustedTarget.id = `adjusted-${index}`;
            targetCell.appendChild(adjustedTarget);
            
            // Realized revenue input
            const realizedCell = document.createElement('div');
            const realizedInput = document.createElement('input');
            realizedInput.type = 'number';
            realizedInput.min = '0';
            realizedInput.placeholder = 'Enter actual';
            realizedInput.id = `realized-${index}`;
            realizedInput.addEventListener('input', updateCalculations);
            realizedCell.appendChild(realizedInput);
            
            // Placeholder cells for calculated values
            const dealsCell = document.createElement('div');
            dealsCell.id = `deals-${index}`;
            
            const demosCell = document.createElement('div');
            demosCell.id = `demos-${index}`;
            
            const leadsCell = document.createElement('div');
            leadsCell.id = `leads-${index}`;
            
            const existingRevenueCell = document.createElement('div');
            existingRevenueCell.id = `existing-${index}`;
            
            // Append all cells
            monthlyGrid.appendChild(monthCell);
            monthlyGrid.appendChild(targetCell);
            monthlyGrid.appendChild(realizedCell);
            monthlyGrid.appendChild(dealsCell);
            monthlyGrid.appendChild(demosCell);
            monthlyGrid.appendChild(leadsCell);
            monthlyGrid.appendChild(existingRevenueCell);
        });
    }
    
    function updateCalculations() {
        const leadToCustomerRate = parseFloat(document.getElementById('leadToCustomerRate').value) / 100;
        const demoToCustomerRate = parseFloat(document.getElementById('demoToCustomerRate').value) / 100;
        const customerPayment = parseFloat(document.getElementById('customerPayment').value);
        const paymentDelay = parseInt(document.getElementById('paymentDelay').value);
        const baseExistingRevenue = parseFloat(document.getElementById('existingRevenue').value);
        const existingGrowthRate = parseFloat(document.getElementById('existingGrowth').value) / 100;
        
        // First calculate existing revenue for all months
        const monthlyExistingRevenue = months.map((_, index) => {
            const growthFactor = Math.pow(1 + existingGrowthRate, index);
            return baseExistingRevenue * growthFactor;
        });
        
        // Find the last month with realized revenue and calculate cumulative gap
        let lastRealizedMonth = -1;
        let cumulativeGap = 0;
        let totalRealizedRevenue = 0;
        let totalTargetForRealizedMonths = 0;
        let totalExistingRevenue = 0;
        
        // First pass: find last month with any realized revenue entry
        for (let i = 0; i < 12; i++) {
            const realizedInput = document.getElementById(`realized-${i}`);
            const realizedValue = realizedInput.value.trim();
            if (realizedValue !== '') {
                lastRealizedMonth = Math.max(lastRealizedMonth, i);
            }
        }
        
        // Second pass: calculate gap only for months up to last realized
        for (let i = 0; i <= lastRealizedMonth; i++) {
            const targetRevenue = parseFloat(document.getElementById(`target-${i}`).value) || 0;
            const realizedInput = document.getElementById(`realized-${i}`);
            const realizedValue = realizedInput.value.trim();
            
            totalExistingRevenue += monthlyExistingRevenue[i];
            totalTargetForRealizedMonths += targetRevenue;
            
            if (realizedValue !== '') {
                // Only consider months where we've explicitly entered a value
                const realizedAmount = parseFloat(realizedValue) || 0;
                totalRealizedRevenue += realizedAmount;
                cumulativeGap += realizedAmount - targetRevenue;
            }
        }
        
        // Calculate remaining months and adjustment needed
        const remainingMonths = 12 - (lastRealizedMonth + 1);
        const monthlyAdjustment = remainingMonths > 0 ? -cumulativeGap / remainingMonths : 0;
        
        // Initialize metrics array
        const monthlyMetrics = Array(12).fill().map(() => ({
            revenue: 0,
            realizedRevenue: 0,
            deals: 0,
            demos: 0,
            leads: 0,
            existingRevenue: 0,
            newRevenueNeeded: 0,
            isAdjusted: false,
            isRealized: false,
            hasRealizedValue: false
        }));
        
        // Third pass: calculate adjusted targets and metrics
        let totalDeals = 0;
        let totalDemos = 0;
        let totalLeads = 0;
        let adjustedTotalRevenue = 0;
        
        months.forEach((month, index) => {
            const targetRevenue = parseFloat(document.getElementById(`target-${index}`).value) || 0;
            const realizedInput = document.getElementById(`realized-${index}`);
            const realizedValue = realizedInput.value.trim();
            const monthlyExisting = monthlyExistingRevenue[index];
            
            monthlyMetrics[index].existingRevenue = monthlyExisting;
            
            if (realizedValue !== '') {
                // Month has realized revenue (including explicit zeros)
                const realizedAmount = parseFloat(realizedValue) || 0;
                monthlyMetrics[index].realizedRevenue = realizedAmount;
                monthlyMetrics[index].revenue = targetRevenue;
                monthlyMetrics[index].isRealized = true;
                monthlyMetrics[index].hasRealizedValue = true;
                monthlyMetrics[index].newRevenueNeeded = Math.max(0, targetRevenue - monthlyExisting);
                adjustedTotalRevenue += realizedAmount;
            } else if (index > lastRealizedMonth) {
                // Future month - adjust target if needed
                let adjustedTarget = targetRevenue;
                
                if (remainingMonths > 0) {
                    // Add the monthly adjustment to the target
                    adjustedTarget = Math.max(0, targetRevenue + monthlyAdjustment);
                }
                
                monthlyMetrics[index].revenue = adjustedTarget;
                monthlyMetrics[index].newRevenueNeeded = Math.max(0, adjustedTarget - monthlyExisting);
                monthlyMetrics[index].isAdjusted = true;
                adjustedTotalRevenue += adjustedTarget;
            } else {
                // Past month without realized revenue - use target
                monthlyMetrics[index].revenue = targetRevenue;
                monthlyMetrics[index].newRevenueNeeded = Math.max(0, targetRevenue - monthlyExisting);
                adjustedTotalRevenue += targetRevenue;
            }
            
            // Calculate required activities
            const dealsNeeded = Math.ceil(monthlyMetrics[index].newRevenueNeeded / customerPayment);
            const demosNeeded = Math.ceil(dealsNeeded / demoToCustomerRate);
            const leadsNeeded = Math.ceil(dealsNeeded / leadToCustomerRate);
            
            // Account for payment delay
            const activityMonth = index - Math.ceil(paymentDelay / 30);
            if (activityMonth >= 0 && activityMonth < 12) {
                monthlyMetrics[activityMonth].deals = dealsNeeded;
                monthlyMetrics[activityMonth].demos = demosNeeded;
                monthlyMetrics[activityMonth].leads = leadsNeeded;
                
                totalDeals += dealsNeeded;
                totalDemos += demosNeeded;
                totalLeads += leadsNeeded;
            }
        });
        
        // Update the display for each month
        monthlyMetrics.forEach((metrics, index) => {
            const targetInput = document.getElementById(`target-${index}`);
            const adjustedTarget = document.getElementById(`adjusted-${index}`);
            const realizedInput = document.getElementById(`realized-${index}`);
            
            // Reset classes
            targetInput.classList.remove('deficit-warning', 'surplus-positive');
            realizedInput.classList.remove('deficit-warning', 'surplus-positive');
            adjustedTarget.classList.remove('deficit-warning', 'surplus-positive');
            adjustedTarget.textContent = ''; // Clear adjusted target display
            
            if (metrics.hasRealizedValue) {
                // Show realized vs target comparison
                const diff = metrics.realizedRevenue - metrics.revenue;
                realizedInput.classList.add(diff >= 0 ? 'surplus-positive' : 'deficit-warning');
            } else if (metrics.isAdjusted && metrics.revenue !== parseFloat(targetInput.value)) {
                // Show adjusted target as text below the input
                const originalTarget = parseFloat(targetInput.value);
                const diff = metrics.revenue - originalTarget;
                adjustedTarget.textContent = `Adjusted: $${Math.round(metrics.revenue).toLocaleString()} (${diff >= 0 ? '+' : ''}$${Math.round(diff).toLocaleString()})`;
                adjustedTarget.classList.add(diff > 0 ? 'deficit-warning' : 'surplus-positive');
            }
            
            document.getElementById(`deals-${index}`).textContent = metrics.deals.toLocaleString();
            document.getElementById(`demos-${index}`).textContent = metrics.demos.toLocaleString();
            document.getElementById(`leads-${index}`).textContent = metrics.leads.toLocaleString();
            document.getElementById(`existing-${index}`).textContent = `$${metrics.existingRevenue.toLocaleString()}`;
        });
        
        // Update summary
        resultsSummary.innerHTML = `
            <ul>
                <li>Total Revenue Target: $${adjustedTotalRevenue.toLocaleString()}</li>
                <li>Realized Revenue: $${totalRealizedRevenue.toLocaleString()}</li>
                <li>Target for Realized Months: $${totalTargetForRealizedMonths.toLocaleString()}</li>
                <li>Cumulative Gap: <span class="${cumulativeGap >= 0 ? 'surplus-positive' : 'deficit-warning'}">$${cumulativeGap.toLocaleString()}</span></li>
                ${remainingMonths > 0 ? `
                <li>Remaining Months: ${remainingMonths}</li>
                <li>Monthly Adjustment Needed: <span class="${monthlyAdjustment <= 0 ? 'surplus-positive' : 'deficit-warning'}">$${Math.abs(Math.round(monthlyAdjustment)).toLocaleString()}</span></li>
                ` : ''}
                <li>Total Deals Needed: ${totalDeals.toLocaleString()}</li>
                <li>Total Demos Required: ${totalDemos.toLocaleString()}</li>
                <li>Total Leads Required: ${totalLeads.toLocaleString()}</li>
            </ul>
        `;
        
        renderRevenueChart(monthlyMetrics);
        renderTrendsChart(monthlyMetrics);
    }
    
    function renderRevenueChart(data) {
        // Clear previous chart
        revenueChartContainer.innerHTML = '';
        
        // Add description
        const description = document.createElement('p');
        description.className = 'chart-description';
        description.textContent = 'This chart shows the breakdown between existing revenue and new revenue needed to meet your monthly targets. Hover over the bars to see detailed values.';
        revenueChartContainer.appendChild(description);
        
        const margin = {top: 40, right: 30, bottom: 60, left: 80};
        const width = revenueChartContainer.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        const svg = d3.select('#revenueChart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        const x = d3.scaleBand()
            .domain(months)
            .range([0, width])
            .padding(0.2);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.revenue) * 1.1])
            .range([height, 0]);
        
        // Add X axis
        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-45)');
        
        // Add Y axis
        svg.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => `$${d3.format(',.0f')(d)}`));
        
        // Add gridlines
        svg.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickSize(-width)
                .tickFormat(''));
        
        // Add stacked bars with hover
        data.forEach((d, i) => {
            const barGroup = svg.append('g');
            
            // Existing revenue bar
            barGroup.append('rect')
                .attr('class', 'bar existing-revenue')
                .attr('x', x(months[i]))
                .attr('width', x.bandwidth())
                .attr('y', y(d.existingRevenue))
                .attr('height', height - y(d.existingRevenue))
                .on('mouseover', function(event) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                    tooltip.html(`
                        <div class="tooltip-title">${months[i]}</div>
                        <div class="tooltip-value">Existing Revenue: $${d.existingRevenue.toLocaleString()}</div>
                        <div class="tooltip-value">New Revenue: $${d.newRevenueNeeded.toLocaleString()}</div>
                        <div class="tooltip-value">Total Target: $${d.revenue.toLocaleString()}</div>
                    `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
            
            // New revenue needed bar
            barGroup.append('rect')
                .attr('class', 'bar new-revenue')
                .attr('x', x(months[i]))
                .attr('width', x.bandwidth())
                .attr('y', y(d.existingRevenue + d.newRevenueNeeded))
                .attr('height', y(d.existingRevenue) - y(d.existingRevenue + d.newRevenueNeeded));
        });
        
        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 200}, -30)`);
        
        legend.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .style('fill', '#34c759');
        
        legend.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .text('Existing Revenue');
        
        legend.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('x', 120)
            .style('fill', '#0091ff');
        
        legend.append('text')
            .attr('x', 140)
            .attr('y', 12)
            .text('New Revenue');
    }
    
    function renderTrendsChart(data) {
        // Clear previous chart
        trendsChartContainer.innerHTML = '';
        
        // Add description
        const description = document.createElement('p');
        description.className = 'chart-description';
        description.textContent = 'This chart shows the required sales activities over time. The offset in trends reflects the payment delay setting. Hover over the lines to see monthly requirements.';
        trendsChartContainer.appendChild(description);
        
        const margin = {top: 40, right: 80, bottom: 60, left: 80};
        const width = trendsChartContainer.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        const svg = d3.select('#trendsChart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        const x = d3.scaleBand()
            .domain(months)
            .range([0, width])
            .padding(0.2);
        
        // Create scales for each metric
        const yLeads = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.leads) * 1.1])
            .range([height, 0]);
        
        const yDemos = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.demos) * 1.1])
            .range([height, 0]);
        
        const yDeals = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.deals) * 1.1])
            .range([height, 0]);
        
        // Add X axis
        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-45)');
        
        // Add Y axis for leads
        svg.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yLeads));
        
        // Add Y axis for deals
        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(${width},0)`)
            .call(d3.axisRight(yDeals));
        
        // Create line generators
        const leadLine = d3.line()
            .x((d, i) => x(months[i]) + x.bandwidth() / 2)
            .y(d => yLeads(d.leads));
        
        const demoLine = d3.line()
            .x((d, i) => x(months[i]) + x.bandwidth() / 2)
            .y(d => yDemos(d.demos));
        
        const dealLine = d3.line()
            .x((d, i) => x(months[i]) + x.bandwidth() / 2)
            .y(d => yDeals(d.deals));
        
        // Create a vertical line for hover interaction
        const focusLine = svg.append('line')
            .attr('class', 'focus-line')
            .attr('y1', 0)
            .attr('y2', height)
            .style('opacity', 0)
            .style('stroke', '#516f90')
            .style('stroke-width', 1)
            .style('stroke-dasharray', '3,3');
        
        // Create invisible overlay for mouse tracking
        const overlay = svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all');
        
        // Mouse move handler
        overlay.on('mousemove', function(event) {
            const [mouseX] = d3.pointer(event);
            const xValue = Math.floor(mouseX / (width / 12));
            if (xValue >= 0 && xValue < 12) {
                const d = data[xValue];
                focusLine
                    .attr('x1', x(months[xValue]) + x.bandwidth() / 2)
                    .attr('x2', x(months[xValue]) + x.bandwidth() / 2)
                    .style('opacity', 1);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                tooltip.html(`
                    <div class="tooltip-title">${months[xValue]}</div>
                    <div class="tooltip-value">Leads Required: ${d.leads.toLocaleString()}</div>
                    <div class="tooltip-value">Demos Required: ${d.demos.toLocaleString()}</div>
                    <div class="tooltip-value">Deals Required: ${d.deals.toLocaleString()}</div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            }
        });
        
        overlay.on('mouseout', function() {
            focusLine.style('opacity', 0);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
        
        // Add the lines
        svg.append('path')
            .datum(data)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 2)
            .attr('d', leadLine);
        
        svg.append('path')
            .datum(data)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', '#ffd93d')
            .attr('stroke-width', 2)
            .attr('d', demoLine);
        
        svg.append('path')
            .datum(data)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', '#4ecdc4')
            .attr('stroke-width', 2)
            .attr('d', dealLine);
        
        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 300}, -30)`);
        
        const legendItems = [
            {color: '#ff6b6b', text: 'Leads Required'},
            {color: '#ffd93d', text: 'Demos Required'},
            {color: '#4ecdc4', text: 'Deals Required'}
        ];
        
        legendItems.forEach((item, i) => {
            const g = legend.append('g')
                .attr('transform', `translate(${i * 100}, 0)`);
            
            g.append('line')
                .attr('x1', 0)
                .attr('x2', 20)
                .attr('y1', 10)
                .attr('y2', 10)
                .attr('stroke', item.color)
                .attr('stroke-width', 2);
            
            g.append('text')
                .attr('x', 25)
                .attr('y', 13)
                .text(item.text)
                .style('font-size', '12px');
        });
    }
    
    // Initial setup
    createMonthlyRows();
    loadScenarios();
    updateCalculations();
    
    // Add event listeners to all inputs
    document.getElementById('leadToCustomerRate').addEventListener('input', updateCalculations);
    document.getElementById('demoToCustomerRate').addEventListener('input', updateCalculations);
    document.getElementById('customerPayment').addEventListener('input', updateCalculations);
    document.getElementById('paymentDelay').addEventListener('input', updateCalculations);
    document.getElementById('existingRevenue').addEventListener('input', updateCalculations);
    document.getElementById('existingGrowth').addEventListener('input', updateCalculations);
}); 