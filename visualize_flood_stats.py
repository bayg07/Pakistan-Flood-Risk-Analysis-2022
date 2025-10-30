import matplotlib.pyplot as plt
import numpy as np

# Data from your GEE analysis
provinces = ['Sindh', 'Balochistan', 'Punjab', 'KPK']
flood_area = [12392, 8907, 3771, 0]
colors = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D']

# Create figure
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Bar chart
bars = ax1.bar(provinces, flood_area, color=colors, edgecolor='black', linewidth=1.5)
ax1.set_ylabel('Flooded Area (sq km)', fontsize=12, fontweight='bold')
ax1.set_title('2022 Pakistan Floods: Affected Area by Province', 
              fontsize=14, fontweight='bold', pad=20)
ax1.grid(axis='y', alpha=0.3, linestyle='--')

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    if height > 0:
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height):,} km²',
                ha='center', va='bottom', fontsize=10, fontweight='bold')

# Pie chart
percentages = [a/sum(flood_area)*100 if sum(flood_area) > 0 else 0 for a in flood_area]
explode = (0.1, 0.05, 0, 0)  # Emphasize Sindh

ax2.pie([p for p in flood_area if p > 0], 
        labels=[provinces[i] for i, a in enumerate(flood_area) if a > 0],
        colors=[colors[i] for i, a in enumerate(flood_area) if a > 0],
        autopct='%1.1f%%',
        explode=[e for i, e in enumerate(explode) if flood_area[i] > 0],
        shadow=True,
        startangle=90)
ax2.set_title('Distribution of Flood Impact', fontsize=14, fontweight='bold')

# Overall statistics
total_area = sum(flood_area)
ax1.text(0.5, 0.95, f'Total Affected Area: {total_area:,} sq km', 
         transform=ax1.transAxes, ha='center', va='top',
         bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5),
         fontsize=11, fontweight='bold')

plt.tight_layout()
plt.savefig('Flood_Statistics_Visualization.png', dpi=300, bbox_inches='tight')
print('✅ Visualization saved as: Flood_Statistics_Visualization.png')
plt.show()