var d3 = require('d3');

/*
- ticks
- tick buffer
- label offset from tick labels
- label collisions
*/

require('angular').module('vgraph').directive('vgraphAxis', [
  function () {
    function collides(p, b) { // point and boundry
      return !(
        p.bottom < b.top ||
        p.top > b.bottom ||
        p.right < b.left ||
        p.left > b.right
      );
    }

    return {
      scope: {
        orient: '=vgraphAxis',
        adjust: '=axisAdjust',
        rotation: '=tickRotation',
        viewVisiblity: '@viewVisiblity',
        view: '@view'
      },
      require: ['^vgraphChart'],
      link: function (scope, el, attrs, requirements) {
        // I'd like to not do it this way, but can't think of a good way how not to.
        var graph = requirements[0],
          view = graph.getView(scope.view || 'default'),
          express,
          makeTicks,
          box = graph.box,
          axis = d3.svg.axis(),
          className = 'axis',
          labelOffset = 0,
          tickRotation = null,
          labelClean = true,
          labelEndpoints = false,
          tickLength = parseInt(attrs.tickLength) || 0,
          tickPadding = parseInt(attrs.tickPadding) || 3,
          tickMargin = parseInt(attrs.tickMargin) || 0,
          min,
          max,
          ticks,
          $ticks,
          $tickMarks,
          $tickMargin,
          $axisLabel,
          $axisPadding,
          $axisLabelWrap,
          $el = d3.select(el[0]);

        $el.attr('visibility', 'hidden');

        $ticks = $el.append('g').attr('class', 'ticks');
        $axisPadding = $el.append('g').attr('class', 'padding');
        $tickMarks = $axisPadding.append('g')
          .attr('class', 'tick-marks');
        $tickMargin = $axisPadding.append('rect')
          .attr('class', 'tick-margin');
        $axisLabelWrap = $el.append('g').attr('class', 'label-wrap');

        if (attrs.tickRotation) {
          tickRotation = parseInt(attrs.tickRotation, 10) % 360;
        }

        if (attrs.labelOffset) {
          labelOffset = scope.$eval(attrs.labelOffset);
        }

        if (attrs.labelClean) {
          labelClean = scope.$eval(attrs.labelClean);
        }

        if (attrs.labelEndpoints) {
          labelEndpoints = scope.$eval(attrs.labelEndpoints);
        }

        if (scope.view) {
        	scope.$watch('view', function (viewName) {
        		view = graph.getView(viewName || 'default');
        	});
        }

        if (attrs.axisLabel) {
          $axisLabel = $axisLabelWrap.append('text')
            .attr('class', 'axis-label label');

          scope.$parent.$watch(attrs.axisLabel, function (label) {
            $axisLabel.text(label);
          });
        }

        makeTicks = function () {
          if (attrs.tickMarks) {
            axis.tickValues(scope.$eval(attrs.tickMarks));

            ticks = [];
          } else if (attrs.tickCount) {
            axis.ticks(scope.$eval(attrs.tickCount));

            ticks = [];
          } else {
            axis.ticks(10);

            ticks = [];
          }
        };

        switch (scope.orient) {
          case 'top':
            express = function () {
              var axisMaxMin;

              $el.attr('class', className + ' x top')
                .attr('transform', 'translate(' + box.left + ',' + (box.top - tickLength) + ')')
                .attr('width', box.width)
                .attr('height', box.padding.top);

              if ($axisLabel) {
                $axisLabel.attr('text-anchor', 'middle')
                  .attr('x', box.width / 2)
                  .attr('y', box.padding.top - labelOffset);
              }

              if (tickMargin) {
                $tickMargin
                  .attr('height', tickMargin)
                  .attr('width', box.inner.width)
                  .attr('x', 0)
                  .attr('y', -tickMargin);
              }

              $tickMarks.attr('transform', 'translate(-' + box.margin.left + ',0)');

              if (ticks) {
                axis.orient('top')
                  .tickFormat(view.x.format)
                  .innerTickSize(-(box.inner.height + tickLength + tickMargin))
                  .outerTickSize(0)
                  .tickPadding(tickPadding + tickLength + tickMargin)
                  .scale(view.x.scale);

                if (view.x.tick) {
                  axis.ticks(
                    view.x.tick.interval,
                    view.x.tick.step
                  );
                }

                $ticks.attr('transform', 'translate(-' + box.margin.left + ',' + box.padding.top + ')')
                  .call(axis);

                axisMaxMin = $el.selectAll('g.axis-cap').data(view.x.scale.domain());

                if (labelEndpoints) {
                  axisMaxMin.enter().append('g').attr('class', function (d, i) {
                      return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
                    })
                    .append('text');

                  axisMaxMin.exit().remove();

                  axisMaxMin.attr('transform', function (d) {
                      return 'translate(' + (view.x.scale(d) - box.margin.left) + ',0)';
                    })
                    .select('text')
                    .text(function (d) {
                      var v = view.x.format(d);
                      return ('' + v).match('NaN') ? '' : v;
                    })
                    .attr('dy', '-0.25em')
                    .attr('y', box.padding.top)
                    .attr('text-anchor', 'middle');
                }

                if (tickRotation) {
                  if ($ticks.select('.tick text')[0][0] === null) {
                    return;
                  }

                  $ticks.selectAll('.tick text')
                    .attr('transform', 'translate(0,' + $ticks.select('.tick text').attr('y') + ') rotate(' + tickRotation + ',0,0)')
                    .attr('y', '0')
                    .style('text-anchor', tickRotation % 360 > 0 ? 'end' : 'start');

                  axisMaxMin.select('text')
                    .attr('transform', 'rotate(' + tickRotation + ',0,0)')
                    .style('text-anchor', scope.rotation % 360 > 0 ? 'end' : 'start');
                }
              }
            };
            break;


          case 'bottom':
            express = function () {
              var axisMaxMin;

              $el.attr('class', className + ' x bottom')
                .attr('transform',
                  'translate(' + box.left + ',' + box.inner.bottom + ')'
                )
                .attr('width', box.width)
                .attr('height', box.padding.bottom);

              if ($axisLabel) {
                $axisLabel.attr('text-anchor', 'middle')
                  .attr('x', box.width / 2)
                  .attr('y', box.padding.bottom + labelOffset);
              }

              if (tickMargin) {
                $tickMargin
                  .attr('height', tickMargin)
                  .attr('width', box.inner.width)
                  .attr('x', 0)
                  .attr('y', 0);
              }

              $tickMarks.attr('transform', 'translate(-' + box.margin.left + ',0)');

              if (ticks) {
                axis.orient('bottom')
                  .tickFormat(view.x.format)
                  .innerTickSize(box.inner.height + tickLength + tickMargin)
                  .outerTickSize(0)
                  .tickPadding(tickPadding + tickLength + tickMargin)
                  .scale(view.x.scale);

                if (view.x.tick) {
                  axis.ticks(
                    view.x.tick.interval,
                    view.x.tick.step
                  );
                }

                $ticks.attr('transform', 'translate(-' + box.margin.left + ',' + (-box.inner.height) + ')')
                  .call(axis);

                axisMaxMin = $el.selectAll('g.axis-cap').data(view.x.scale.domain());

                if (labelEndpoints) {
                  axisMaxMin.enter().append('g').attr('class', function (d, i) {
                      return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
                    })
                    .append('text');

                  axisMaxMin.exit().remove();

                  axisMaxMin.attr('transform', function (d) {
                      return 'translate(' + (view.x.scale(d) - box.margin.left) + ',0)';
                    })
                    .select('text')
                    .text(function (d) {
                      var v = view.x.format(d);
                      return ('' + v).match('NaN') ? '' : v;
                    })
                    .attr('dy', '1em')
                    .attr('y', 0)
                    /*
                    .attr( 'x', function(){
                    	return -d3.select(this).node().getComputedTextLength() / 2;
                    })
                    */
                    .attr('text-anchor', 'middle');
                }

                if (tickRotation) {
                  if ($ticks.select('.tick text')[0][0] === null) {
                    return;
                  }

                  $ticks.selectAll('.tick text')
                    .attr('transform', function () {
                      return 'translate(0,' + d3.select(this).attr('y') + ') rotate(' + tickRotation + ',0,0)';
                    })
                    .attr('y', '0')
                    .style('text-anchor', tickRotation % 360 > 0 ? 'start' : 'end');

                  axisMaxMin.select('text')
                    .attr('transform', 'rotate(' + tickRotation + ',0,0)')
                    .style('text-anchor', scope.rotation % 360 > 0 ? 'start' : 'end');
                }
              }
            };
            break;

          case 'right':
            express = function () {
              var axisMaxMin;

              $el.attr('class', className + ' y right')
                .attr('transform',
                  'translate(' + tickLength + ',' + box.top + ')'
                )
                .attr('width', box.padding.right)
                .attr('height', box.height);

              $axisLabelWrap.attr('transform',
                'translate(' + (box.right - box.padding.right) + ',' + box.height + ') rotate( 90 )'
              );

              if ($axisLabel) {
                $axisLabel.attr('text-anchor', 'middle')
                  .attr('x', -(box.height / 2))
                  .attr('y', -labelOffset);
              }

              if (tickMargin) {
                $tickMargin
                  .attr('height', box.inner.height)
                  .attr('width', tickMargin)
                  .attr('x', -tickMargin)
                  .attr('y', 0);
              }

              $tickMarks.attr('transform', 'translate(-' + box.padding.right + ',' + (-box.top || 0) + ')');

              if (ticks) {
                axis.orient('right')
                  .tickFormat(view.y.format)
                  .innerTickSize(-(box.inner.width + tickLength + tickMargin))
                  .outerTickSize(0)
                  .tickPadding(tickPadding + tickLength + tickMargin)
                  .scale(view.y.scale);

                if (view.y.tick) {
                  axis.ticks(
                    view.y.tick.interval,
                    view.y.tick.step
                  );
                }

                $ticks.attr('transform', 'translate(' + (box.inner.right) + ',' + (-box.top || 0) + ')');
                $ticks.call(axis);
                $ticks.select('.domain').attr('transform', 'translate(' + (tickLength + tickMargin) + ',0)');

                if (labelEndpoints) {
                  axisMaxMin = $el.selectAll('g.axis-cap').data(view.y.scale.domain());

                  axisMaxMin.enter().append('g').attr('class', function (d, i) {
                      return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
                    })
                    .append('text');

                  axisMaxMin.exit().remove();

                  axisMaxMin.attr('transform', function (d) {
                      return 'translate(0,' + (view.y.scale(d) - box.margin.top) + ')';
                    })
                    .select('text')
                    .text(function (d) {
                      var v = view.y.format(d);
                      return ('' + v).match('NaN') ? '' : v;
                    })
                    .attr('dy', '.25em')
                    .attr('x', box.padding.left - axis.tickPadding())
                    .attr('text-anchor', 'end');
                }
              }
            };
            break;


          case 'left':
            express = function () {
              var axisMaxMin;

              $el.attr('class', className + ' y left')
                .attr('transform',
                  'translate(' + box.left + ',' + box.top + ')'
                )
                .attr('width', box.padding.left)
                .attr('height', box.height);

              $axisLabelWrap.attr('transform',
                'translate(' + box.padding.left + ',' + box.height + ') rotate( -90 )'
              );

              if ($axisLabel) {
                $axisLabel.attr('text-anchor', 'middle')
                  .attr('x', box.height / 2)
                  .attr('y', -labelOffset);
              }

              if (!view.viewport || view.viewport.maxValue === view.viewport.minValue) {
                return;
              }

              if (tickMargin) {
                $tickMargin
                  .attr('height', box.inner.height)
                  .attr('width', tickMargin)
                  .attr('x', -tickMargin)
                  .attr('y', 0);
              }

              $tickMarks.attr('transform', 'translate(' + box.padding.left + ',' + (-box.top || 0) + ')');

              if (ticks) {
                axis.orient('left')
                  .tickFormat(view.y.format)
                  .innerTickSize(-(box.inner.width + tickLength + tickMargin))
                  .outerTickSize(0)
                  .tickPadding(tickPadding + tickLength + tickMargin)
                  .scale(view.y.scale);

                if (view.y.tick) {
                  axis.ticks(
                    view.y.tick.interval,
                    view.y.tick.step
                  );
                }

                $ticks.attr('transform', 'translate(' + (box.padding.left - tickLength - tickMargin) + ',' + (-box.top || 0) + ')')
                  .call(axis);

                $ticks.select('.domain').attr('transform', 'translate(' + (tickLength + tickMargin) + ',0)');

                if (labelEndpoints) {
                  axisMaxMin = $el.selectAll('g.axis-cap').data(view.y.scale.domain());

                  axisMaxMin.enter().append('g').attr('class', function (d, i) {
                      return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
                    })
                    .append('text');

                  axisMaxMin.exit().remove();

                  axisMaxMin.attr('transform', function (d) {
                      return 'translate(0,' + (view.y.scale(d) - box.margin.top) + ')';
                    })
                    .select('text')
                    .text(function (d) {
                      var v = view.y.format(d);
                      return ('' + v).match('NaN') ? '' : v;
                    })
                    .attr('dy', '.25em')
                    .attr('x', box.padding.left - axis.tickPadding())
                    .attr('text-anchor', 'end');
                }
              }
            };
            break;

          case 'rightonly':
            express = function express() {
              var axisMaxMin;

              $el.attr('class', className + ' y left').attr('transform', 'translate(' + tickLength + ',' + box.top + ')').attr('width', box.padding.right).attr('height', box.height);

              $axisLabelWrap.attr('transform', 'translate(' + (box.right - box.padding.right) + ',' + box.height + ') rotate( 90 )');

              if ($axisLabel) {
                $axisLabel.attr('text-anchor', 'middle').attr('x', -(box.height / 2)).attr('y', -labelOffset);
              }

              if (tickMargin) {
                $tickMargin.attr('height', box.inner.height).attr('width', tickMargin).attr('x', -tickMargin).attr('y', 0);
              }

              $tickMarks.attr('transform', 'translate(-' + box.padding.right + ',' + (-box.top || 0) + ')');

              if (ticks) {
                axis.orient('right').tickFormat(view.y.format).innerTickSize(-(box.inner.width + tickLength + tickMargin)).outerTickSize(0).tickPadding(tickPadding + tickLength + tickMargin).scale(view.y.scale);

                if (view.y.tick) {
                  axis.ticks(view.y.tick.interval, view.y.tick.step);
                }

                $ticks.attr('transform', 'translate(' + box.inner.right + ',' + (-box.top || 0) + ')');
                $ticks.call(axis);
                $ticks.select('.domain').attr('transform', 'translate(' + (tickLength + tickMargin) + ',0)');

                if (labelEndpoints) {
                  axisMaxMin = $el.selectAll('g.axis-cap').data(view.y.scale.domain());

                  axisMaxMin.enter().append('g').attr('class', function (d, i) {
                    return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
                  }).append('text');

                  axisMaxMin.exit().remove();

                  axisMaxMin.attr('transform', function (d) {
                    return 'translate(0,' + (view.y.scale(d) - box.margin.top) + ')';
                  }).select('text').text(function (d) {
                    var v = view.y.format(d);
                    return ('' + v).match('NaN') ? '' : v;
                  }).attr('dy', '.25em').attr('x', box.padding.left - axis.tickPadding()).attr('text-anchor', 'end');
                }
              }
            };
            break;
        }

        function hide() {
        	if (!scope.viewVisiblity) {
        		$el.attr('visibility', 'hidden');
        	}
        }

        scope.$on('$destroy',
          graph.$subscribe({
            'error': hide,
            'loading': hide
          })
        );

        graph.registerComponent({
          build: function () {
            if (ticks === undefined) {
              makeTicks();
            }

            express();
          },
          process: function () {
            ticks.length = 0;

            if (tickLength) {
              $ticks.selectAll('.tick text').each(function (d) {
                ticks.push({
                  el: this,
                  val: d,
                  position: this.getBoundingClientRect()
                });
              });

              ticks.sort(function (a, b) {
                var t = a.position.top - b.position.top;

                if (t) {
                  return t;
                } else {
                  return a.position.left - b.position.left;
                }
              });
            }

            if (labelClean) {
              min = $el.select('.axis-min text').node();
              if (min) {
                min = min.getBoundingClientRect();
              }

              max = $el.select('.axis-max text').node();
              if (max) {
                max = max.getBoundingClientRect();
              }
            }
          },
          finalize: function () {
            var data = view.filtered,
              valid,
              t,
              p,
              i, c,
              change,
              boundry = {};

            if (!data && !scope.viewVisiblity) {
              $el.attr('visibility', 'hidden');
              return;
            }

            $el.attr('visibility', '');

            $tickMarks.selectAll('line').remove();

            for (i = 0, c = ticks.length; i < c; i++) {
              valid = true;
              t = ticks[i];
              p = t.position;

              if (labelClean && min && (collides(p, min) || collides(p, max))) {
                t.el.setAttribute('class', 'collided');
                valid = false;
              } else if (boundry.left === undefined) {
                boundry.left = p.left;
                boundry.right = p.right;
                boundry.width = p.width;
                boundry.top = p.top;
                boundry.bottom = p.bottom;
                boundry.height = p.height;

                t.el.setAttribute('class', '');
              } else {
                if (labelClean && collides(p, boundry)) {
                  t.el.setAttribute('class', 'collided');
                  valid = false;
                } else {
                  change = false;
                  if (p.left < boundry.left) {
                    boundry.left = p.left;
                    change = true;
                  }

                  if (p.right > boundry.right) {
                    boundry.right = p.right;
                    change = true;
                  }

                  if (change) {
                    boundry.width = boundry.right - boundry.left;
                    change = false;
                  }

                  if (p.top < boundry.top) {
                    boundry.top = p.top;
                    change = true;
                  }

                  if (p.bottom > boundry.bottom) {
                    boundry.bottom = p.bottom;
                    change = true;
                  }

                  if (change) {
                    boundry.height = boundry.bottom - boundry.top;
                  }

                  t.el.setAttribute('class', '');
                }
              }
            }
          }
        }, 'axis-' + scope.orient);
      }
    };
  }
]);
