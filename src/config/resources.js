/**
 * 预制资源配置
 */

export const resourceCategories = [
  {
    id: 'component',
    name: 'UI 组件',
    items: [
      {
        id: 'button-primary',
        name: '主按钮',
        icon: 'ri-toggle-fill',
        data: {
          tag: 'Frame',
          name: 'Button/Primary',
          width: 120,
          height: 40,
          fill: '#409eff',
          cornerRadius: 6,
          overflow: 'show',
          shadow: { x: 0, y: 2, blur: 4, color: 'rgba(64, 158, 255, 0.2)' },
          children: [
            {
              tag: 'Text',
              text: '确 定',
              fill: '#fff',
              fontSize: 14,
              fontWeight: 'bold',
              x: 60,
              y: 20,
              textAlign: 'center',
              verticalAlign: 'middle',
              cursor: 'pointer'
            }
          ]
        }
      },
      {
        id: 'card-simple',
        name: '信息卡片',
        icon: 'ri-id-card-line',
        data: {
          tag: 'Frame',
          name: 'Card/Simple',
          width: 280,
          height: 160,
          fill: '#fff',
          cornerRadius: 8,
          overflow: 'show',
          stroke: '#ebeef5',
          strokeWidth: 1,
          shadow: { x: 0, y: 4, blur: 12, color: 'rgba(0, 0, 0, 0.05)' },
          children: [
            {
              tag: 'Rect',
              name: 'Header',
              x: 0,
              y: 0,
              width: 280,
              height: 48,
              fill: 'rgba(245, 247, 250, 0.5)',
              cornerRadius: [8, 8, 0, 0]
            },
            {
              tag: 'Text',
              name: 'Title',
              text: '卡片标题',
              fontSize: 16,
              fontWeight: 'bold',
              fill: '#303133',
              x: 16,
              y: 14
            },
            {
              tag: 'Text',
              name: 'Content',
              text: '这里是卡片的内容区域，可以放置一些描述性文字。',
              fontSize: 14,
              lineHeight: 1.5,
              fill: '#606266',
              x: 16,
              y: 64,
              width: 248
            },
            {
              tag: 'Frame',
              name: 'Action',
              x: 200,
              y: 120,
              width: 64,
              height: 28,
              fill: '#ecf5ff',
              cornerRadius: 4,
              stroke: '#d9ecff',
              overflow: 'show',
              cursor: 'pointer',
              children: [
                {
                  tag: 'Text',
                  text: '操作',
                  fontSize: 12,
                  fill: '#409eff',
                  x: 32,
                  y: 14,
                  textAlign: 'center',
                  verticalAlign: 'middle'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'input-field',
        name: '输入框',
        icon: 'ri-input-cursor-move',
        data: {
          tag: 'Frame',
          name: 'Input/Default',
          width: 240,
          height: 36,
          fill: '#fff',
          cornerRadius: 4,
          stroke: '#dcdfe6',
          strokeWidth: 1,
          overflow: 'show',
          children: [
            {
              tag: 'Text',
              text: '请输入内容',
              fontSize: 14,
              fill: '#c0c4cc',
              x: 12,
              y: 18,
              verticalAlign: 'middle',
              cursor: 'text'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'layout',
    name: '布局模版',
    items: [
      {
        id: 'mobile-frame',
        name: '手机页面',
        icon: 'ri-smartphone-line',
        data: {
          tag: 'Frame',
          fill: '#fff',
          stroke: '#e0e0e0',
          strokeWidth: 2,
          overflow: 'hidden',
          width: 393,
          height: 852,
          cornerRadius: 40,
          name: 'iPhone 14 Pro',
          editable: true,
          children: [
            {
              tag: 'Text',
              fill: '#999999',
              text: 'iPhone 14 Pro',
              fontSize: 12,
              lineHeight: {
                type: 'percent',
                value: 1.5
              },
              x: 0,
              y: -25,
              editable: false,
              hittable: false,
              data: {
                isFrameLabel: true
              }
            },
            {
              tag: 'Group',
              name: 'Status Bar',
              width: 393,
              height: 54,
              hitChildren: false,
              children: [
                {
                  tag: 'Text',
                  name: 'Time',
                  text: '9:41',
                  fontSize: 17,
                  fontWeight: '600',
                  fill: '#000000',
                  x: 40,
                  y: 14,
                  textAlign: 'center',
                  width: 54
                },
                {
                  tag: 'Rect',
                  name: 'Dynamic Island',
                  x: 126,
                  y: 11,
                  width: 125,
                  height: 37,
                  cornerRadius: 18.5,
                  fill: '#000000'
                },
                {
                  tag: 'Group',
                  name: 'Right Icons',
                  x: 318,
                  y: 19,
                  children: [
                    {
                      tag: 'Group',
                      name: 'Signal',
                      x: 0,
                      y: 0,
                      children: [
                        { tag: 'Rect', x: 0, y: 8, width: 3, height: 4, fill: '#000', cornerRadius: 1 },
                        { tag: 'Rect', x: 5, y: 6, width: 3, height: 6, fill: '#000', cornerRadius: 1 },
                        { tag: 'Rect', x: 10, y: 3.5, width: 3, height: 8.5, fill: '#000', cornerRadius: 1 },
                        { tag: 'Rect', x: 15, y: 1, width: 3, height: 11, fill: '#000', cornerRadius: 1 }
                      ]
                    },
                    {
                      tag: 'Path',
                      name: 'Wifi',
                      x: 23,
                      y: -1,
                      scale: 0.8,
                      path: 'M12 2C7.95 2 4.21 3.16 1.05 5.16L12 18.73L22.95 5.16C19.79 3.16 16.05 2 12 2Z',
                      fill: '#000'
                    },
                    {
                      tag: 'Group',
                      name: 'Battery',
                      x: 45,
                      y: 0,
                      children: [
                        { tag: 'Rect', x: 0, y: 0, width: 22, height: 11.5, stroke: '#000', strokeWidth: 1.5, cornerRadius: 3, fill: 'transparent' },
                        { tag: 'Rect', x: 2, y: 2, width: 18, height: 7.5, fill: '#000', cornerRadius: 1.5 },
                        { tag: 'Path', path: 'M 23 4 L 23 7.5', stroke: '#000', strokeWidth: 1.5, lineCap: 'round' }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              tag: 'Rect',
              name: 'Home Indicator',
              x: 128,
              y: 839,
              width: 137,
              height: 5,
              editable: true,
              fill: '#000',
              cornerRadius: 2.5,
              data: {}
            }
          ]
        }
      },
      {
        id: 'pc-frame',
        name: 'PC 页面',
        icon: 'ri-computer-line',
        data: {
          tag: 'Frame',
          fill: '#fff',
          stroke: '#e0e0e0',
          strokeWidth: 2,
          overflow: 'hidden',
          width: 1440,
          height: 1024,
          name: 'Desktop / Browser',
          editable: true,
          children: [
            {
              tag: 'Text',
              fill: '#999999',
              text: 'Desktop 1440 x 1024',
              fontSize: 12,
              lineHeight: {
                type: 'percent',
                value: 1.5
              },
              x: 0,
              y: -25,
              editable: false,
              hittable: false,
              data: {
                isFrameLabel: true
              }
            },
            {
              tag: 'Group',
              name: 'Browser Header',
              x: 0,
              y: 0,
              children: [
                {
                  tag: 'Rect',
                  width: 1440,
                  height: 80,
                  fill: '#F3F4F6',
                  stroke: '#E5E7EB',
                  strokeWidth: 1
                },
                {
                  tag: 'Group',
                  name: 'Controls',
                  x: 20,
                  y: 20,
                  children: [
                    { tag: 'Ellipse', width: 12, height: 12, fill: '#FF5F56' },
                    { tag: 'Ellipse', x: 20, width: 12, height: 12, fill: '#FFBD2E' },
                    { tag: 'Ellipse', x: 40, width: 12, height: 12, fill: '#27C93F' }
                  ]
                },
                {
                  tag: 'Group',
                  name: 'Active Tab',
                  x: 80,
                  y: 12,
                  children: [
                    {
                      tag: 'Path',
                      path: 'M 0 28 L 8 8 C 10 2 14 0 20 0 L 220 0 C 226 0 230 2 232 8 L 240 28 Z',
                      fill: '#FFFFFF'
                    },
                    {
                      tag: 'Text',
                      text: 'New Tab',
                      x: 30,
                      y: 8,
                      fontSize: 12,
                      fill: '#374151'
                    },
                    {
                      tag: 'Text',
                      text: '✕',
                      x: 210,
                      y: 8,
                      fontSize: 10,
                      fill: '#9CA3AF',
                      cursor: 'pointer'
                    }
                  ]
                },
                {
                  tag: 'Group',
                  name: 'Navigation',
                  x: 20,
                  y: 50,
                  children: [
                    { tag: 'Path', path: 'M 10 10 L 2 10 L 6 4 M 2 10 L 6 16', stroke: '#6B7280', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
                    { tag: 'Path', x: 30, path: 'M 2 10 L 10 10 L 6 4 M 10 10 L 6 16', stroke: '#D1D5DB', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
                    { tag: 'Path', x: 60, path: 'M 10 2 A 8 8 0 1 1 4 13', stroke: '#6B7280', strokeWidth: 2, lineCap: 'round' },
                    { tag: 'Path', x: 60, path: 'M 10 2 L 10 6 L 6 2', stroke: '#6B7280', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' }
                  ]
                },
                {
                  tag: 'Group',
                  name: 'Address Bar',
                  x: 100,
                  y: 46,
                  children: [
                    {
                      tag: 'Rect',
                      width: 1200,
                      height: 28,
                      cornerRadius: 14,
                      fill: '#FFFFFF',
                      stroke: '#E5E7EB'
                    },
                    {
                      tag: 'Text',
                      text: 'https://',
                      x: 16,
                      y: 6,
                      fontSize: 13,
                      fill: '#9CA3AF'
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        id: 'chart-placeholder',
        name: '图表占位',
        icon: 'ri-bar-chart-line',
        data: {
          tag: 'Frame',
          name: 'Chart/Bar',
          width: 300,
          height: 200,
          fill: '#f5f7fa',
          cornerRadius: 4,
          overflow: 'show',
          children: [
            {
              tag: 'Line',
              points: [40, 20, 40, 160, 280, 160],
              stroke: '#909399',
              strokeWidth: 2
            },
            {
              tag: 'Rect',
              x: 60,
              y: 80,
              width: 30,
              height: 80,
              fill: '#409eff'
            },
            {
              tag: 'Rect',
              x: 110,
              y: 60,
              width: 30,
              height: 100,
              fill: '#67c23a'
            },
            {
              tag: 'Rect',
              x: 160,
              y: 100,
              width: 30,
              height: 60,
              fill: '#e6a23c'
            },
            {
              tag: 'Rect',
              x: 210,
              y: 40,
              width: 30,
              height: 120,
              fill: '#f56c6c'
            }
          ]
        }
      }
    ]
  }
]
