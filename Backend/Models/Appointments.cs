using Backend.db.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = null!;

        [Required]
        public int StaffId { get; set; }

        [ForeignKey(nameof(StaffId))]
        public Staff Staff { get; set; } = null!;

        [Required]
        public string Reason { get; set; } = null!;

        [Required]
        public DateTime AppointmentTime { get; set; }
    }
}