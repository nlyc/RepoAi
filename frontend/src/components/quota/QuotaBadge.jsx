// components/quota/QuotaBadge.jsx - 今日额度显示
import React from 'react';
import { Tag, Tooltip } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import useAppStore from '../../store/useAppStore';

export default function QuotaBadge() {
  const quota = useAppStore(s => s.quota);
  if (!quota) return null;

  const { used, limit, remaining } = quota;
  const color = remaining === 0 ? 'error' : remaining <= 3 ? 'warning' : 'processing';

  return (
    <Tooltip title={`今日已用 ${used}/${limit} 次，${remaining > 0 ? `剩余 ${remaining} 次` : '已达上限，明日重置'}`}>
      <Tag icon={<ThunderboltOutlined />} color={color} style={{ cursor: 'default' }}>
        {remaining}/{limit}
      </Tag>
    </Tooltip>
  );
}
