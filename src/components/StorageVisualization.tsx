import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface StorageVisualizationProps {
  used: number;
  limit: number;
}

export const StorageVisualization: React.FC<StorageVisualizationProps> = ({ used, limit }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 120;
    const height = 120;
    const radius = Math.min(width, height) / 2;
    const thickness = 10;

    const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Background track
    g.append('path')
      .datum({ endAngle: 2 * Math.PI })
      .style('fill', '#1e293b') // slate-800
      .attr('d', d3.arc<any>().innerRadius(radius - thickness).outerRadius(radius).startAngle(0) as any);

    // Progress
    const percentage = Math.min(used / limit, 1);
    
    const arc = d3.arc<any>()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(percentage * 2 * Math.PI);

    g.append('path')
      .style('fill', '#6366f1') // indigo-500
      .attr('d', arc as any);
      
    // Text in center
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', 'white')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`${Math.round(percentage * 100)}%`);

  }, [used, limit]);

  return <svg ref={svgRef} width="120" height="120" />;
};
