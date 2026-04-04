import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import PageContainer from '../components/PageContainer';
import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Search } from '@mui/icons-material';

const SearchEnginePage = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAllParticipants = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/participants`);
        setParticipants(response.data);
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllParticipants();
  }, []);

  const filteredParticipants = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) {
      return participants;
    }

    return participants.filter((participant) => {
      const values = [
        participant.name,
        participant.type,
        participant.dateOfBirth,
        participant.email,
        participant.facebookLink,
        participant.checkedInBy?.name
      ];

      return values.some((value) => (value || '').toLowerCase().includes(keyword));
    });
  }, [participants, searchQuery]);

  return (
    <>
      <Header title="CISV Meme System" />
      <PageContainer maxWidth="xl">
        <Box sx={{ width: '100%' }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 4,
              fontWeight: 600,
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: '40%',
                height: 4,
                borderRadius: 2,
                backgroundColor: 'primary.main',
              }
            }}
          >
            Participant Search Sheet
          </Typography>

          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
            <TextField
              fullWidth
              placeholder="Tìm theo tên, email, Facebook, ngày sinh, loại, người check-in..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Ngày sinh</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Facebook</TableCell>
                      <TableCell>Check-in</TableCell>
                      <TableCell>Người check-in</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredParticipants.map((participant) => (
                      <TableRow key={participant._id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{participant.name}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={participant.type === 'leader' ? 'Leader' : 'Supporter'}
                            color={participant.type === 'leader' ? 'error' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{participant.dateOfBirth || '-'}</TableCell>
                        <TableCell>{participant.email || '-'}</TableCell>
                        <TableCell>
                          {participant.facebookLink ? (
                            <Link href={participant.facebookLink} target="_blank" rel="noreferrer">
                              Mở link
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={participant.checkInStatus ? 'Đã check-in' : 'Chưa check-in'}
                            color={participant.checkInStatus ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{participant.checkedInBy?.name || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          Không có participant nào khớp với từ khóa tìm kiếm.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </PageContainer>
    </>
  );
};

export default SearchEnginePage;
