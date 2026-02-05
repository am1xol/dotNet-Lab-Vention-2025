import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Box, Typography, FormHelperText } from '@mui/material';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  error,
  helperText,
  placeholder,
}) => {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link', 'clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'link',
  ];

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            fontWeight: 500,
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          {label}
        </Typography>
      )}

      <Box
        sx={{
          '& .quill': {
            borderRadius: 1,
            border: (theme) =>
              `1px solid ${error ? theme.palette.error.main : 'rgba(0, 0, 0, 0.23)'}`,
            '&:hover': {
              borderColor: (theme) =>
                error ? theme.palette.error.main : 'rgba(0, 0, 0, 0.87)',
            },
            '&:focus-within': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            },
          },
          '& .ql-toolbar': {
            border: 'none',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          },
          '& .ql-container': {
            border: 'none',
            minHeight: '200px',
            backgroundColor: '#ffffff',
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            fontFamily: 'Roboto, sans-serif',
            fontSize: '1rem',
          },
          '& .ql-editor': {
            minHeight: '200px',
          },
          '& .ql-editor:focus': {
            outline: 'none',
          },
        }}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder || 'Введите описание...'}
        />
      </Box>

      {helperText && (
        <FormHelperText error={error} sx={{ mx: 0 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};
