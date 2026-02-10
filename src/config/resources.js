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
          tag: 'Box',
          name: 'Button/Primary',
          children: [
            {
              tag: 'Rect',
              width: 120,
              height: 40,
              cornerRadius: 6,
              fill: '#409eff',
              shadow: { x: 0, y: 2, blur: 4, color: 'rgba(64, 158, 255, 0.2)' },
              cursor: 'pointer'
            },
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
              tag: 'Box',
              name: 'Action',
              x: 200,
              y: 120,
              cursor: 'pointer',
              children: [
                {
                  tag: 'Rect',
                  width: 64,
                  height: 28,
                  cornerRadius: 4,
                  fill: '#ecf5ff',
                  stroke: '#d9ecff'
                },
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
          tag: 'Box',
          name: 'Input/Default',
          children: [
            {
              tag: 'Rect',
              width: 240,
              height: 36,
              cornerRadius: 4,
              fill: '#fff',
              stroke: '#dcdfe6',
              strokeWidth: 1,
              cursor: 'text'
            },
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
          overflow: 'hidden',
          width: 393,
          height: 852,
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
              y: -20,
              editable: false,
              hittable: false,
              data: {
                isFrameLabel: true
              }
            },
            {
              tag: 'Rect',
              name: 'Status Bar BG',
              width: 393,
              height: 44,
              editable: true,
              fill: 'transparent',
              data: {}
            },
            {
              tag: 'Text',
              fill: '#000',
              text: '9:41',
              fontSize: 15,
              fontWeight: 'bold',
              lineHeight: {
                type: 'percent',
                value: 1.5
              },
              x: 48,
              y: 14,
              editable: true,
              data: {}
            },
            {
              tag: 'Rect',
              name: 'Home Indicator',
              x: 129.5,
              y: 839,
              width: 134,
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
        id: 'chart-placeholder',
        name: '图表占位',
        icon: 'ri-bar-chart-line',
        data: {
          tag: 'Box',
          name: 'Chart/Bar',
          children: [
            {
              tag: 'Rect',
              width: 300,
              height: 200,
              fill: '#f5f7fa',
              cornerRadius: 4
            },
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
